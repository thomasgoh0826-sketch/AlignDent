import { describe, expect, it } from 'vitest'
import { JobRepository, type JobStorage } from '../../src/services/jobRepository'

describe('crash-safe job recovery', () => {
  it('reopens finished items and returns interrupted work to pending', async () => {
    let contents = ''
    const storage: JobStorage = {
      read: async () => contents,
      writeAtomic: async (value) => { contents = value },
    }
    const repository = new JobRepository(storage)
    await repository.save({ id: 'job-1', updatedAt: '2026-09-04T00:00:00.000Z', items: [
      { id: '1', name: 'done.jpg', status: 'ready', outputPath: 'done-out.jpg' },
      { id: '2', name: 'busy.jpg', status: 'processing' },
    ] })
    const reopened = await repository.load()
    expect(reopened?.items[0]).toMatchObject({ status: 'ready', outputPath: 'done-out.jpg' })
    expect(reopened?.items[1]).toMatchObject({ status: 'pending' })
  })

  it('does not crash on an incomplete temporary-era file', async () => {
    const repository = new JobRepository({ read: async () => '{bad json', writeAtomic: async () => undefined })
    await expect(repository.load()).resolves.toBeUndefined()
  })
})
