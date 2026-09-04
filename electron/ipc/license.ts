import type { IpcMain } from 'electron'
import { createHash, webcrypto } from 'node:crypto'
import { execFile } from 'node:child_process'
import { hostname } from 'node:os'
import { readFile, rename, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { verifyLicenseToken } from '../../src/domain/license'
import { ALIGNDENT_PUBLIC_LICENSE_KEY } from '../../src/domain/publicLicenseKey'

const run = promisify(execFile)

export function computeDeviceCode(machineIdentifier: string) {
  const digest = createHash('sha256').update(`AlignDent|${machineIdentifier.trim().toLowerCase()}`).digest('hex').toUpperCase()
  return `AD-${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`
}

async function windowsMachineIdentifier() {
  if (process.platform !== 'win32') return hostname()
  try {
    const result = await run('reg.exe', ['QUERY', 'HKLM\\SOFTWARE\\Microsoft\\Cryptography', '/v', 'MachineGuid'], { windowsHide: true })
    const match = result.stdout.match(/MachineGuid\s+REG_SZ\s+([^\r\n]+)/i)
    return match?.[1]?.trim() || hostname()
  } catch {
    return hostname()
  }
}

async function readToken(filePath: string) {
  try { return (await readFile(filePath, 'utf8')).trim() } catch { return '' }
}

export function registerLicenseHandlers(ipc: IpcMain, licensePath: string) {
  const getDeviceCode = async () => computeDeviceCode(await windowsMachineIdentifier())
  const status = async () => {
    const deviceCode = await getDeviceCode()
    const token = await readToken(licensePath)
    if (!token) return { licensed: false, deviceCode }
    const verified = await verifyLicenseToken(token, ALIGNDENT_PUBLIC_LICENSE_KEY, deviceCode, webcrypto.subtle as SubtleCrypto)
    return verified.ok ? { licensed: true, deviceCode, licensee: verified.payload.licensee } : { licensed: false, deviceCode }
  }
  ipc.handle('license:status', status)
  ipc.handle('license:activate', async (_event, token: string) => {
    const deviceCode = await getDeviceCode()
    const verified = await verifyLicenseToken(token, ALIGNDENT_PUBLIC_LICENSE_KEY, deviceCode, webcrypto.subtle as SubtleCrypto)
    if (!verified.ok) return verified
    const temporary = `${licensePath}.tmp`
    await writeFile(temporary, token.trim(), 'utf8')
    await rename(temporary, licensePath)
    return { ok: true as const }
  })
}
