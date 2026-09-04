export {}

declare global {
  interface Window {
    alignDent?: Readonly<{
      platform: NodeJS.Platform
      version: string
      files?: Readonly<{
        chooseImages: () => Promise<string[]>
        chooseFolder: () => Promise<string[]>
        readPreview?: (filePath: string) => Promise<string>
        chooseExportFolder?: () => Promise<string | undefined>
      }>
      export?: Readonly<{ image: (input: unknown) => Promise<string> }>
      downloads?: Readonly<{ images: (urls: string[]) => Promise<string[]> }>
      jobs?: Readonly<{ load: () => Promise<unknown>; save: (job: unknown) => Promise<{ saved: true }> }>
      settings?: Readonly<{
        getApi: () => Promise<{ baseUrl: string; model: string; configured: boolean }>
        saveApi: (input: { baseUrl: string; model: string; apiKey?: string }) => Promise<{ saved: true }>
      }>
      api?: Readonly<{
        parseCommand: (command: string) => Promise<{ patch: Record<string, unknown>; source: 'api' | 'offline' }>
      }>
      license?: Readonly<{
        status: () => Promise<{ licensed: boolean; deviceCode: string; licensee?: string }>
        activate: (token: string) => Promise<{ ok: boolean; reason?: string }>
      }>
    }>
  }
}
