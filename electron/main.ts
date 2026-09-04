import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerFileHandlers } from './ipc/files'
import { registerSettingsHandlers } from './ipc/settings'
import { registerApiHandlers } from './ipc/api'
import { registerLicenseHandlers } from './ipc/license'
import { registerExportHandlers } from './ipc/export'
import { registerDownloadHandlers } from './ipc/downloads'
import { registerJobHandlers } from './ipc/jobs'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 720,
    backgroundColor: '#f2f5f4',
    title: 'AlignDent',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(currentDirectory, 'preload.mjs'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
    },
  })

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  window.webContents.on('will-navigate', (event, targetUrl) => {
    const developmentUrl = process.env.VITE_DEV_SERVER_URL
    const allowedUrl = developmentUrl ?? new URL('../dist/index.html', import.meta.url).href
    if (!targetUrl.startsWith(allowedUrl)) event.preventDefault()
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    void window.loadFile(path.join(currentDirectory, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  registerFileHandlers(ipcMain, dialog)
  const settingsPath = path.join(app.getPath('userData'), 'api-settings.json')
  registerSettingsHandlers(ipcMain, settingsPath)
  registerApiHandlers(ipcMain, settingsPath)
  registerLicenseHandlers(ipcMain, path.join(app.getPath('userData'), 'license.key'))
  registerExportHandlers(ipcMain)
  registerDownloadHandlers(ipcMain, dialog)
  registerJobHandlers(ipcMain, path.join(app.getPath('userData'), 'last-job.json'))
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
