import { z } from 'zod'

const licensePayloadSchema = z.object({
  product: z.literal('AlignDent'),
  licensee: z.string().min(1).max(120),
  deviceId: z.string().min(6).max(80),
  issuedAt: z.string().datetime(),
}).strict()

export type LicensePayload = z.infer<typeof licensePayloadSchema>
export type LicenseVerification = { ok: true; payload: LicensePayload } | { ok: false; reason: 'invalid' | 'device-mismatch' }

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function canonicalPayload(payload: LicensePayload) {
  return JSON.stringify({ product: payload.product, licensee: payload.licensee, deviceId: payload.deviceId, issuedAt: payload.issuedAt })
}

export async function createLicenseToken(payloadInput: LicensePayload, privateJwk: JsonWebKey, subtle: SubtleCrypto = crypto.subtle) {
  const payload = licensePayloadSchema.parse(payloadInput)
  const body = toBase64Url(new TextEncoder().encode(canonicalPayload(payload)))
  const key = await subtle.importKey('jwk', privateJwk, { name: 'Ed25519' }, false, ['sign'])
  const signature = await subtle.sign({ name: 'Ed25519' }, key, new TextEncoder().encode(body))
  return `${body}.${toBase64Url(new Uint8Array(signature))}`
}

export async function verifyLicenseToken(token: string, publicJwk: JsonWebKey, expectedDeviceId: string, subtle: SubtleCrypto = crypto.subtle): Promise<LicenseVerification> {
  try {
    const [body, signaturePart, extra] = token.trim().split('.')
    if (!body || !signaturePart || extra) return { ok: false, reason: 'invalid' }
    const key = await subtle.importKey('jwk', publicJwk, { name: 'Ed25519' }, false, ['verify'])
    const valid = await subtle.verify({ name: 'Ed25519' }, key, fromBase64Url(signaturePart), new TextEncoder().encode(body))
    if (!valid) return { ok: false, reason: 'invalid' }
    const payload = licensePayloadSchema.parse(JSON.parse(new TextDecoder().decode(fromBase64Url(body))))
    if (payload.deviceId !== expectedDeviceId) return { ok: false, reason: 'device-mismatch' }
    return { ok: true, payload }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}
