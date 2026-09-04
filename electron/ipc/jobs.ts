import type { IpcMain } from 'electron'
import { readFile, rename, writeFile } from 'node:fs/promises'

export function registerJobHandlers(ipc: IpcMain, jobPath: string) {
  ipc.handle('jobs:load', async () => {
    try { return JSON.parse(await readFile(jobPath, 'utf8')) as unknown } catch { return undefined }
  })
  ipc.handle('jobs:save', async (_event, job: unknown) => {
    const temporary = `${jobPath}.tmp`
    await writeFile(temporary, JSON.stringify(job), 'utf8')
    await rename(temporary, jobPath)
    return { saved: true }
  })
}
