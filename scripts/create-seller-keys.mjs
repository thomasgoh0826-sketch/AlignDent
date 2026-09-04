import { generateKeyPairSync } from 'node:crypto'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const output = process.argv[2]
if (!output) throw new Error('Usage: node scripts/create-seller-keys.mjs <private-key-output>')
if (existsSync(output)) throw new Error(`Refusing to overwrite existing seller key: ${output}`)
const { privateKey, publicKey } = generateKeyPairSync('ed25519')
mkdirSync(path.dirname(output), { recursive: true })
writeFileSync(output, `${JSON.stringify(privateKey.export({ format: 'jwk' }), null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
process.stdout.write(JSON.stringify(publicKey.export({ format: 'jwk' })))
