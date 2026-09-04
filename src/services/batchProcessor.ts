export type BatchItemStatus = 'pending' | 'processing' | 'ready' | 'failed'

export type BatchItem = {
  id: string
  name: string
  status: BatchItemStatus
  outputPath?: string
  error?: string
}

type BatchProcessorOptions = {
  process: (item: BatchItem) => Promise<string>
  persist: (items: readonly BatchItem[]) => Promise<void>
  concurrency?: number
}

export class BatchProcessor {
  private cancelled = false
  private readonly processItem: BatchProcessorOptions['process']
  private readonly persist: BatchProcessorOptions['persist']
  private readonly concurrency: number

  constructor(options: BatchProcessorOptions) {
    this.processItem = options.process
    this.persist = options.persist
    this.concurrency = Math.max(1, Math.min(2, options.concurrency ?? 2))
  }

  cancel() {
    this.cancelled = true
  }

  async run(input: readonly BatchItem[]) {
    const items = input.map((item) => ({ ...item }))
    let cursor = 0
    const worker = async () => {
      while (!this.cancelled) {
        const index = cursor
        cursor += 1
        const item = items[index]
        if (!item) return
        if (item.status !== 'pending') continue
        item.status = 'processing'
        try {
          item.outputPath = await this.processItem({ ...item })
          item.status = 'ready'
          delete item.error
        } catch (error) {
          item.status = 'failed'
          item.error = error instanceof Error ? error.message : '处理失败'
        }
        await this.persist(items)
      }
    }
    await Promise.all(Array.from({ length: this.concurrency }, () => worker()))
    return items
  }
}
