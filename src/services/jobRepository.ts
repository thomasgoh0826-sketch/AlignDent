import { z } from 'zod'

const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['pending', 'processing', 'ready', 'failed']),
  outputPath: z.string().optional(),
  error: z.string().optional(),
})

const jobSchema = z.object({
  id: z.string(),
  updatedAt: z.string(),
  items: z.array(itemSchema),
})

export type PersistedJob = z.infer<typeof jobSchema>

export type JobStorage = {
  read: () => Promise<string>
  writeAtomic: (contents: string) => Promise<void>
}

export class JobRepository {
  constructor(private readonly storage: JobStorage) {}

  async save(job: PersistedJob) {
    const validated = jobSchema.parse(job)
    await this.storage.writeAtomic(JSON.stringify(validated))
  }

  async load(): Promise<PersistedJob | undefined> {
    try {
      const parsed = jobSchema.parse(JSON.parse(await this.storage.read()))
      return {
        ...parsed,
        items: parsed.items.map((item) => item.status === 'processing' ? { ...item, status: 'pending' as const } : item),
      }
    } catch {
      return undefined
    }
  }
}
