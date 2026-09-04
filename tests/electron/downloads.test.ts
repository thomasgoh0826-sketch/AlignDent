import { describe, expect, it } from 'vitest'
import { validateDownloadBatch, validateDownloadUrl } from '../../electron/ipc/downloads'

describe('remote image download validation', () => {
  it('accepts HTTP and HTTPS only', () => {
    expect(validateDownloadUrl('https://example.com/a.jpg')).toEqual({ ok: true })
    expect(validateDownloadUrl('http://example.com/a.png')).toEqual({ ok: true })
    expect(validateDownloadUrl('file:///C:/secret.txt')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
    })
    expect(validateDownloadUrl('javascript:alert(1)')).toEqual({
      ok: false,
      code: 'UNSUPPORTED_PROTOCOL',
    })
  })

  it('rejects malformed URLs and batches above the safety limit', () => {
    expect(validateDownloadUrl('not a url')).toEqual({
      ok: false,
      code: 'INVALID_URL',
    })
    expect(validateDownloadBatch(Array.from({ length: 201 }, (_, index) => `https://example.com/${index}.jpg`))).toEqual({
      ok: false,
      code: 'TOO_MANY_URLS',
    })
  })
})
