import { mkdtemp, readFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import { exportStandardImage, resolveOutputName } from '../../electron/ipc/export'

const temporaryDirectories: string[] = []

afterEach(async () => {
  for (const directory of temporaryDirectories.splice(0)) {
    await import('node:fs/promises').then(({ rm }) => rm(directory, { recursive: true, force: true }))
  }
})

describe('safe image export', () => {
  it('selects a non-conflicting filename by default', () => {
    const existing = new Set(['face.jpg', 'face (2).jpg'])
    expect(resolveOutputName('face.jpg', existing)).toBe('face (3).jpg')
  })

  it('writes exact dimensions and removes source metadata', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'aligndent-export-'))
    temporaryDirectories.push(directory)
    const sourcePath = path.join(directory, 'source.jpg')
    const outputPath = path.join(directory, 'standard.jpg')
    await sharp({
      create: { width: 80, height: 100, channels: 3, background: '#cbd5d1' },
    })
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toFile(sourcePath)

    await exportStandardImage({
      sourcePath,
      outputPath,
      outputWidth: 40,
      outputHeight: 50,
      matrix: { a: 0.5, b: 0, c: 0, d: 0.5, tx: 0, ty: 0 },
      format: 'jpeg',
      quality: 90,
    })

    const output = await readFile(outputPath)
    const metadata = await sharp(output).metadata()
    expect(metadata.width).toBe(40)
    expect(metadata.height).toBe(50)
    expect(metadata.orientation).toBeUndefined()
    expect(metadata.exif).toBeUndefined()
  })
})
