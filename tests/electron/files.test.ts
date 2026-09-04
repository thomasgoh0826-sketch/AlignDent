import { describe, expect, it } from 'vitest'
import { filterSupportedImages } from '../../electron/ipc/files'

describe('local file import', () => {
  it('keeps only supported image files without changing their paths', () => {
    const files = [
      'C:\\Patients\\A.JPG',
      'C:\\Patients\\B.webp',
      'C:\\Patients\\notes.pdf',
      'C:\\Patients\\script.exe',
    ]

    expect(filterSupportedImages(files)).toEqual([
      'C:\\Patients\\A.JPG',
      'C:\\Patients\\B.webp',
    ])
  })
})
