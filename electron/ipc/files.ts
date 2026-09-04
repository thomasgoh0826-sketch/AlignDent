import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import type { IpcMain } from 'electron'

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp'])

export function filterSupportedImages(paths: readonly string[]) {
  return paths.filter((filePath) => supportedExtensions.has(path.extname(filePath).toLowerCase()))
}

export async function findImagesInDirectory(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await findImagesInDirectory(fullPath)))
    else if (entry.isFile() && supportedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath)
    }
  }
  return files
}

type FileDialog = Readonly<{
  showOpenDialog: (options: {
    properties: Array<'openFile' | 'openDirectory' | 'multiSelections'>
    filters: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ canceled: boolean; filePaths: string[] }>
}>

export function registerFileHandlers(ipcMain: IpcMain, dialog: FileDialog) {
  ipcMain.handle('files:choose-images', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    })
    return result.canceled ? [] : filterSupportedImages(result.filePaths)
  })

  ipcMain.handle('files:choose-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      filters: [{ name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    })
    if (result.canceled || !result.filePaths[0]) return []
    return findImagesInDirectory(result.filePaths[0])
  })

  ipcMain.handle('files:read-preview', async (_event, filePath: string) => {
    const [supported] = filterSupportedImages([filePath])
    if (!supported) throw new Error('不支持的图片格式')
    const info = await stat(filePath)
    if (info.size > 25 * 1024 * 1024) throw new Error('单张图片不能超过 25 MB')
    const extension = path.extname(filePath).toLowerCase()
    const mime = extension === '.png' ? 'image/png' : extension === '.webp' ? 'image/webp' : 'image/jpeg'
    return `data:${mime};base64,${(await readFile(filePath)).toString('base64')}`
  })

  ipcMain.handle('files:choose-export-folder', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory'], filters: [] })
    return result.canceled ? undefined : result.filePaths[0]
  })
}
