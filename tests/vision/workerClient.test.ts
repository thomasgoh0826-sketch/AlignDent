import { describe, expect, it } from 'vitest'
import { FaceWorkerClient, type WorkerPort } from '../../src/vision/workerClient'

class FakeWorker implements WorkerPort {
  posted: unknown[] = []
  listener?: (event: MessageEvent) => void

  postMessage(message: unknown) {
    this.posted.push(message)
  }

  addEventListener(_type: 'message', listener: (event: MessageEvent) => void) {
    this.listener = listener
  }

  removeEventListener(_type: 'message', listener: (event: MessageEvent) => void) {
    if (this.listener === listener) this.listener = undefined
  }
}

describe('face worker client', () => {
  it('matches a worker result to the requesting photo', async () => {
    const worker = new FakeWorker()
    const client = new FaceWorkerClient(worker)
    const pending = client.analyze('photo-7', {} as ImageBitmap)
    const request = worker.posted[0] as { id: string; photoId: string }

    worker.listener?.({
      data: {
        id: request.id,
        ok: true,
        result: { photoId: 'photo-7', faceCount: 0 },
      },
    } as MessageEvent)

    await expect(pending).resolves.toEqual({ photoId: 'photo-7', faceCount: 0 })
    client.dispose()
  })

  it('rejects outstanding work when disposed', async () => {
    const worker = new FakeWorker()
    const client = new FaceWorkerClient(worker)
    const pending = client.analyze('photo-8', {} as ImageBitmap)

    client.dispose()

    await expect(pending).rejects.toThrow('人脸分析已停止')
  })
})
