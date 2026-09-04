export type FileGateway = Readonly<{
  chooseImages: () => Promise<string[]>
  chooseFolder: () => Promise<string[]>
  readPreview?: (filePath: string) => Promise<string>
  chooseExportFolder?: () => Promise<string | undefined>
}>

export function getFileGateway(): FileGateway {
  const bridge = window.alignDent
  if (!bridge?.files) {
    return {
      chooseImages: async () => [],
      chooseFolder: async () => [],
    }
  }
  return bridge.files
}
