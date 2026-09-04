export interface WorkerPort {
  postMessage(message: unknown, transfer?: Transferable[]): void
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void
}

type WorkerSuccess<T> = Readonly<{ id: string; ok: true; result: T }>
type WorkerFailure = Readonly<{ id: string; ok: false; error: string }>
type WorkerResponse<T> = WorkerSuccess<T> | WorkerFailure

type AnalysisResult = Readonly<{
  photoId: string
  faceCount: number
  landmarks?: unknown
}>

export class FaceWorkerClient {
  private nextId = 1
  private readonly pending = new Map<
    string,
    { resolve: (value: AnalysisResult) => void; reject: (reason: Error) => void }
  >()

  private readonly onMessage = (event: MessageEvent<WorkerResponse<AnalysisResult>>) => {
    const request = this.pending.get(event.data.id)
    if (!request) return
    this.pending.delete(event.data.id)
    if (event.data.ok) request.resolve(event.data.result)
    else request.reject(new Error(event.data.error))
  }

  constructor(private readonly worker: WorkerPort) {
    worker.addEventListener('message', this.onMessage)
  }

  analyze(photoId: string, bitmap: ImageBitmap): Promise<AnalysisResult> {
    const id = `face-${this.nextId++}`
    const result = new Promise<AnalysisResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
    })
    this.worker.postMessage({ id, type: 'analyze', photoId, bitmap }, [bitmap])
    return result
  }

  dispose() {
    this.worker.removeEventListener('message', this.onMessage)
    for (const request of this.pending.values()) {
      request.reject(new Error('人脸分析已停止'))
    }
    this.pending.clear()
  }
}
