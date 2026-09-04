import { contextBridge, ipcRenderer } from 'electron'
import packageMetadata from '../package.json'

const bridge = Object.freeze({
  platform: process.platform,
  version: packageMetadata.version,
  files: Object.freeze({
    chooseImages: () => ipcRenderer.invoke('files:choose-images') as Promise<string[]>,
    chooseFolder: () => ipcRenderer.invoke('files:choose-folder') as Promise<string[]>,
    readPreview: (filePath: string) => ipcRenderer.invoke('files:read-preview', filePath) as Promise<string>,
    chooseExportFolder: () => ipcRenderer.invoke('files:choose-export-folder') as Promise<string | undefined>,
  }),
  export: Object.freeze({
    image: (input: unknown) => ipcRenderer.invoke('export:image', input) as Promise<string>,
  }),
  downloads: Object.freeze({
    images: (urls: string[]) => ipcRenderer.invoke('downloads:images', urls) as Promise<string[]>,
  }),
  jobs: Object.freeze({
    load: () => ipcRenderer.invoke('jobs:load') as Promise<unknown>,
    save: (job: unknown) => ipcRenderer.invoke('jobs:save', job) as Promise<{ saved: true }>,
  }),
  settings: Object.freeze({
    getApi: () => ipcRenderer.invoke('settings:get-api') as Promise<{ baseUrl: string; model: string; configured: boolean }>,
    saveApi: (input: { baseUrl: string; model: string; apiKey?: string }) => ipcRenderer.invoke('settings:save-api', input) as Promise<{ saved: true }>,
  }),
  api: Object.freeze({
    parseCommand: (command: string) => ipcRenderer.invoke('api:parse-command', command) as Promise<{ patch: Record<string, unknown>; source: 'api' | 'offline' }>,
  }),
  license: Object.freeze({
    status: () => ipcRenderer.invoke('license:status') as Promise<{ licensed: boolean; deviceCode: string; licensee?: string }>,
    activate: (token: string) => ipcRenderer.invoke('license:activate', token) as Promise<{ ok: boolean; reason?: string }>,
  }),
})

contextBridge.exposeInMainWorld('alignDent', bridge)
