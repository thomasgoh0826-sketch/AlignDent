import { describe, expect, it } from 'vitest'
import { createLicenseToken, verifyLicenseToken, type LicensePayload } from '../../src/domain/license'

async function keys() {
  const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify'])
  return {
    privateKey: await crypto.subtle.exportKey('jwk', pair.privateKey),
    publicKey: await crypto.subtle.exportKey('jwk', pair.publicKey),
  }
}

const payload: LicensePayload = {
  product: 'AlignDent', licensee: '陈医生', deviceId: 'AD-ABCD-1234', issuedAt: '2026-09-04T00:00:00.000Z',
}

describe('offline signed license', () => {
  it('verifies an untampered token for the licensed PC', async () => {
    const pair = await keys()
    const token = await createLicenseToken(payload, pair.privateKey, crypto.subtle)
    await expect(verifyLicenseToken(token, pair.publicKey, payload.deviceId, crypto.subtle)).resolves.toEqual({ ok: true, payload })
  })

  it('rejects changed content and a different device', async () => {
    const pair = await keys()
    const token = await createLicenseToken(payload, pair.privateKey, crypto.subtle)
    const [body, signature] = token.split('.')
    const tampered = `${body.slice(0, -1)}${body.endsWith('A') ? 'B' : 'A'}.${signature}`
    await expect(verifyLicenseToken(tampered, pair.publicKey, payload.deviceId, crypto.subtle)).resolves.toMatchObject({ ok: false })
    await expect(verifyLicenseToken(token, pair.publicKey, 'AD-OTHER-PC', crypto.subtle)).resolves.toEqual({ ok: false, reason: 'device-mismatch' })
  })
})
