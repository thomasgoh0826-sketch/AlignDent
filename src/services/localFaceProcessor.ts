import type { LandmarkSet } from '../domain/types'
import { FaceWorkerClient } from '../vision/workerClient'

export class LocalFaceProcessor {
  private readonly worker: Worker
  private readonly client: FaceWorkerClient

  constructor() {
    this.worker = new Worker(new URL('../vision/worker.ts', import.meta.url), { type: 'module' })
    this.client = new FaceWorkerClient(this.worker)
  }

  async analyze(photoId: string, previewUrl: string) {
    const image = new Image()
    image.decoding = 'async'
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('无法读取图片像素'))
    })
    image.src = previewUrl
    await loaded
    const bitmap = await createImageBitmap(image, { imageOrientation: 'from-image' })
    const sourceWidth = bitmap.width
    const sourceHeight = bitmap.height
    const result = await this.client.analyze(photoId, bitmap)
    return { landmarks: result.landmarks as LandmarkSet, sourceWidth, sourceHeight }
  }

  dispose() {
    this.client.dispose()
    this.worker.terminate()
  }
}
