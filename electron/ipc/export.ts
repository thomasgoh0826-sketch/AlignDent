import { access, rename } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import type { AffineMatrix } from '../../src/domain/types'
import type { IpcMain } from 'electron'

export function resolveOutputName(requestedName: string, existingNames: ReadonlySet<string>) {
  if (!existingNames.has(requestedName)) return requestedName
  const extension = path.extname(requestedName)
  const stem = path.basename(requestedName, extension)
  let index = 2
  let candidate = `${stem} (${index})${extension}`
  while (existingNames.has(candidate)) {
    index += 1
    candidate = `${stem} (${index})${extension}`
  }
  return candidate
}

type ExportInput = Readonly<{
  sourcePath: string
  outputPath: string
  outputWidth: number
  outputHeight: number
  matrix: AffineMatrix
  format: 'jpeg' | 'png'
  quality: number
}>

async function ensureTargetDoesNotExist(filePath: string) {
  try {
    await access(filePath)
  } catch {
    return
  }
  throw new Error('输出文件已存在，请使用新文件名')
}

export async function exportStandardImage(input: ExportInput) {
  await ensureTargetDoesNotExist(input.outputPath)
  const normalized = await sharp(input.sourcePath).rotate().png().toBuffer({ resolveWithObject: true })
  const { a, b, c, d, tx, ty } = input.matrix
  const embedded = normalized.data.toString('base64')
  const svg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${input.outputWidth}" height="${input.outputHeight}" viewBox="0 0 ${input.outputWidth} ${input.outputHeight}"><rect width="100%" height="100%" fill="#ffffff"/><image width="${normalized.info.width}" height="${normalized.info.height}" href="data:image/png;base64,${embedded}" transform="matrix(${a} ${b} ${c} ${d} ${tx} ${ty})"/></svg>`,
  )
  const temporaryPath = `${input.outputPath}.aligndent-part-${process.pid}`
  let pipeline = sharp(svg, { density: 72 })
  if (input.format === 'png') pipeline = pipeline.png({ compressionLevel: 9 })
  else pipeline = pipeline.jpeg({ quality: Math.min(100, Math.max(1, input.quality)), chromaSubsampling: '4:4:4' })
  await pipeline.toFile(temporaryPath)
  await rename(temporaryPath, input.outputPath)
  return input.outputPath
}

export function registerExportHandlers(ipc: IpcMain) {
  ipc.handle('export:image', async (_event, input: Omit<ExportInput, 'outputPath'> & { outputDirectory: string; sourceName: string }) => {
    const extension = input.format === 'png' ? '.png' : '.jpg'
    const stem = path.basename(input.sourceName, path.extname(input.sourceName)).replace(/[<>:"/\\|?*]/g, '_')
    const existing = new Set<string>()
    let requested = `${stem}-standard${extension}`
    let index = 2
    while (true) {
      try { await access(path.join(input.outputDirectory, requested)); existing.add(requested); requested = `${stem}-standard (${index++})${extension}` } catch { break }
    }
    const outputPath = path.join(input.outputDirectory, resolveOutputName(requested, existing))
    return exportStandardImage({ ...input, outputPath })
  })
}
