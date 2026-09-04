import { describe, expect, it } from 'vitest'
import { BatchProcessor, type BatchItem } from '../../src/services/batchProcessor'

describe('resilient batch processing', () => {
  it('limits concurrency to two and isolates item failures', async () => {
    let active = 0
    let peak = 0
    const saved: BatchItem[][] = []
    const processor = new BatchProcessor({
      process: async (item) => {
        active += 1
        peak = Math.max(peak, active)
        await new Promise((resolve) => setTimeout(resolve, 2))
        active -= 1
        if (item.name.includes('corrupt')) throw new Error('无法读取图片')
        if (item.name.includes('two-faces')) throw new Error('检测到多张人脸')
        return `${item.name}.out.jpg`
      },
      persist: async (items) => { saved.push(items.map((item) => ({ ...item }))) },
    })
    const result = await processor.run(['front', 'corrupt', 'profile', 'two-faces'].map((name) => ({ id: name, name, status: 'pending' as const })))
    expect(peak).toBeLessThanOrEqual(2)
    expect(result.filter((item) => item.status === 'ready')).toHaveLength(2)
    expect(result.filter((item) => item.status === 'failed')).toHaveLength(2)
    expect(saved.length).toBeGreaterThanOrEqual(4)
  })

  it('keeps finished work when cancellation is requested', async () => {
    const processor = new BatchProcessor({ process: async (item) => `${item.name}.jpg`, persist: async () => undefined })
    processor.cancel()
    const result = await processor.run([{ id: '1', name: 'one', status: 'pending' }, { id: '2', name: 'two', status: 'pending' }])
    expect(result.every((item) => item.status === 'pending')).toBe(true)
  })
})
