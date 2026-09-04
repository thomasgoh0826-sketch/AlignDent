import { createHash } from 'node:crypto'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const expectedHash = '64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff'
const projectRoot = process.cwd()
const modelDirectory = path.join(projectRoot, 'public', 'models')
const wasmDirectory = path.join(projectRoot, 'public', 'wasm')
const modelPath = path.join(modelDirectory, 'face_landmarker.task')

await mkdir(modelDirectory, { recursive: true })
await mkdir(wasmDirectory, { recursive: true })

const response = await fetch(modelUrl)
if (!response.ok) throw new Error(`Model download failed with HTTP ${response.status}`)
const model = Buffer.from(await response.arrayBuffer())
const actualHash = createHash('sha256').update(model).digest('hex')
if (actualHash !== expectedHash) {
  throw new Error(`Model hash mismatch: expected ${expectedHash}, received ${actualHash}`)
}
await writeFile(modelPath, model)

const wasmSource = path.join(projectRoot, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
for (const file of [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
]) {
  await copyFile(path.join(wasmSource, file), path.join(wasmDirectory, file))
}

const verified = createHash('sha256').update(await readFile(modelPath)).digest('hex')
console.log(`Face model ready: ${verified}`)
