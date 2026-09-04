import { describe, expect, it, vi } from 'vitest'
import { buildTextCommandRequest, parseCommandWithApi, validateApiBaseUrl } from '../../electron/ipc/api'
import { protectSecret } from '../../electron/ipc/settings'

describe('optional text-only API', () => {
  it('rejects insecure remote API addresses but permits local development', () => {
    expect(validateApiBaseUrl('https://api.example.com/v1')).toEqual({ ok: true })
    expect(validateApiBaseUrl('http://localhost:8080/v1')).toEqual({ ok: true })
    expect(validateApiBaseUrl('http://api.example.com/v1')).toMatchObject({ ok: false })
  })

  it('builds a text-only request with no image or local path', () => {
    const request = buildTextCommandRequest('摆正头位，裁成 4:5', 'agnes-mini')
    const serialized = JSON.stringify(request)
    expect(serialized).toContain('摆正头位')
    expect(serialized).not.toMatch(/image|base64|sourcePath|C:\\\\/i)
  })

  it('uses safe storage before a secret can be persisted', () => {
    const encryptString = vi.fn().mockReturnValue(Buffer.from('cipher'))
    expect(protectSecret('sk-private', { isEncryptionAvailable: () => true, encryptString })).toBe('Y2lwaGVy')
    expect(encryptString).toHaveBeenCalledWith('sk-private')
  })

  it('accepts strict JSON patches from an OpenAI-compatible response', async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"ratio":"4:5","eyeLineY":0.3333333333}' } }] }),
    })
    const patch = await parseCommandWithApi('裁成4:5', {
      baseUrl: 'https://api.example.com/v1', model: 'agnes-mini', apiKey: 'secret',
    }, fetcher)
    expect(patch).toEqual({ ratio: '4:5', eyeLineY: 0.3333333333 })
    expect(fetcher).toHaveBeenCalledOnce()
  })
})
