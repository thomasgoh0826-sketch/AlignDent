import { access, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { IpcMain } from 'electron'

const MAX_URLS = 200
const MAX_IMAGE_BYTES = 25 * 1024 * 1024
const allowedTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
])

type DownloadValidation =
  | Readonly<{ ok: true }>
  | Readonly<{
      ok: false
      code: 'INVALID_URL' | 'UNSUPPORTED_PROTOCOL' | 'TOO_MANY_URLS'
    }>

export function validateDownloadUrl(value: string): DownloadValidation {
  let url: URL
  try {
    url = new URL(value)
  } catch {
    return { ok: false, code: 'INVALID_URL' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, code: 'UNSUPPORTED_PROTOCOL' }
  }
  return { ok: true }
}

export function validateDownloadBatch(urls: readonly string[]): DownloadValidation {
  if (urls.length > MAX_URLS) return { ok: false, code: 'TOO_MANY_URLS' }
  for (const url of urls) {
    const result = validateDownloadUrl(url)
    if (!result.ok) return result
  }
  return { ok: true }
}

async function exists(filePath: string) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function safeStem(value: string) {
  const stem = path.basename(value, path.extname(value))
  const withoutReservedCharacters = stem.replace(/[<>:"/\\|?*]/g, '_')
  const withoutControls = [...withoutReservedCharacters]
    .map((character) => (character.charCodeAt(0) < 32 ? '_' : character))
    .join('')
  return withoutControls.trim().slice(0, 80) || 'download'
}

async function uniquePath(directory: string, stem: string, extension: string) {
  let index = 1
  let candidate = path.join(directory, `${stem}${extension}`)
  while (await exists(candidate)) {
    index += 1
    candidate = path.join(directory, `${stem} (${index})${extension}`)
  }
  return candidate
}

export async function downloadImage(
  value: string,
  directory: string,
  fetcher: typeof fetch = fetch,
) {
  const validation = validateDownloadUrl(value)
  if (!validation.ok) throw new Error(`下载地址无效：${validation.code}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60_000)
  try {
    const response = await fetcher(value, {
      redirect: 'follow',
      signal: controller.signal,
    })
    if (!response.ok) throw new Error(`图片下载失败：HTTP ${response.status}`)
    const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase()
    const extension = contentType ? allowedTypes.get(contentType) : undefined
    if (!extension) throw new Error('下载内容不是支持的图片类型')
    const announcedSize = Number(response.headers.get('content-length') ?? 0)
    if (announcedSize > MAX_IMAGE_BYTES) throw new Error('图片超过 25 MB 限制')

    const bytes = Buffer.from(await response.arrayBuffer())
    if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error('图片超过 25 MB 限制')
    const url = new URL(value)
    const outputPath = await uniquePath(directory, safeStem(url.pathname), extension)
    const temporaryPath = `${outputPath}.aligndent-part`
    await writeFile(temporaryPath, bytes, { flag: 'wx' })
    await rename(temporaryPath, outputPath)
    return outputPath
  } finally {
    clearTimeout(timeout)
  }
}

export function registerDownloadHandlers(ipc: IpcMain, dialog: { showOpenDialog: (options: { properties: Array<'openDirectory'>; filters: [] }) => Promise<{ canceled: boolean; filePaths: string[] }> }) {
  ipc.handle('downloads:images', async (_event, urls: string[]) => {
    const validation = validateDownloadBatch(urls)
    if (!validation.ok) throw new Error(`下载列表无效：${validation.code}`)
    const destination = await dialog.showOpenDialog({ properties: ['openDirectory'], filters: [] })
    const directory = destination.filePaths[0]
    if (destination.canceled || !directory) return []
    const outputs: string[] = []
    for (const url of urls) outputs.push(await downloadImage(url, directory))
    return outputs
  })
}
