import type { IpcMain } from 'electron'
import { safeStorage } from 'electron'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'

type SafeStorageLike = Pick<typeof safeStorage, 'isEncryptionAvailable' | 'encryptString'> & Partial<Pick<typeof safeStorage, 'decryptString'>>
export type PublicApiSettings = Readonly<{ baseUrl: string; model: string; configured: boolean }>
type StoredApiSettings = Readonly<{ baseUrl: string; model: string; encryptedApiKey: string }>

export function protectSecret(secret: string, storage: SafeStorageLike) {
  if (!storage.isEncryptionAvailable()) throw new Error('此电脑暂时无法安全保存 API 密钥')
  return storage.encryptString(secret).toString('base64')
}

async function readStored(filePath: string): Promise<StoredApiSettings | undefined> {
  try {
    return JSON.parse(await readFile(filePath, 'utf8')) as StoredApiSettings
  } catch {
    return undefined
  }
}

export async function saveApiSettings(filePath: string, input: { baseUrl: string; model: string; apiKey?: string }, storage: SafeStorageLike = safeStorage) {
  const current = await readStored(filePath)
  const encryptedApiKey = input.apiKey ? protectSecret(input.apiKey, storage) : current?.encryptedApiKey ?? ''
  await mkdir(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.tmp`
  await writeFile(temporary, JSON.stringify({ baseUrl: input.baseUrl, model: input.model, encryptedApiKey }), 'utf8')
  await rename(temporary, filePath)
}

export async function loadPublicApiSettings(filePath: string): Promise<PublicApiSettings> {
  const stored = await readStored(filePath)
  return { baseUrl: stored?.baseUrl ?? '', model: stored?.model ?? '', configured: Boolean(stored?.encryptedApiKey) }
}

export async function loadPrivateApiSettings(filePath: string, storage: SafeStorageLike = safeStorage) {
  const stored = await readStored(filePath)
  if (!stored?.encryptedApiKey || !storage.decryptString) return undefined
  return { baseUrl: stored.baseUrl, model: stored.model, apiKey: storage.decryptString(Buffer.from(stored.encryptedApiKey, 'base64')) }
}

export function registerSettingsHandlers(ipc: IpcMain, filePath: string) {
  ipc.handle('settings:save-api', async (_event, input: { baseUrl: string; model: string; apiKey?: string }) => {
    await saveApiSettings(filePath, input)
    return { saved: true }
  })
  ipc.handle('settings:get-api', () => loadPublicApiSettings(filePath))
}
