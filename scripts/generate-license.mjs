import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'

const args = Object.fromEntries(process.argv.slice(2).reduce((pairs, value, index, all) => index % 2 === 0 ? [...pairs, [value.replace(/^--/, ''), all[index + 1]]] : pairs, []))
if (!args.key || !args.licensee || !args.device) throw new Error('Required: --key <private.jwk> --licensee <name> --device <code>')
const payload = { product: 'AlignDent', licensee: args.licensee, deviceId: args.device, issuedAt: new Date().toISOString() }
const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
const privateKey = createPrivateKey({ key: JSON.parse(readFileSync(args.key, 'utf8')), format: 'jwk' })
const signature = sign(null, Buffer.from(body), privateKey).toString('base64url')
process.stdout.write(`${body}.${signature}\n`)
