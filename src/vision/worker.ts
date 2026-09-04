/// <reference lib="webworker" />

import {
  FaceLandmarker,
  FilesetResolver,
  type ImageSource,
} from '@mediapipe/tasks-vision'
import { detectPrimaryFace } from './faceLandmarker'

declare const self: DedicatedWorkerGlobalScope

let landmarkerPromise: Promise<FaceLandmarker> | undefined

function getLandmarker() {
  landmarkerPromise ??= (async () => {
    const wasmBaseUrl = new URL('../wasm', self.location.href).href
    const modelAssetPath = new URL('../models/face_landmarker.task', self.location.href).href
    const vision = await FilesetResolver.forVisionTasks(wasmBaseUrl, true)
    return FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath, delegate: 'CPU' },
      runningMode: 'IMAGE',
      numFaces: 5,
      minFaceDetectionConfidence: 0.6,
      minFacePresenceConfidence: 0.6,
      minTrackingConfidence: 0.6,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    })
  })()
  return landmarkerPromise
}

self.addEventListener('message', async (event) => {
  const request = event.data as {
    id: string
    type: 'analyze'
    photoId: string
    bitmap: ImageBitmap
  }
  if (request.type !== 'analyze') return

  try {
    const landmarker = await getLandmarker()
    const landmarks = await detectPrimaryFace(request.bitmap as ImageSource, landmarker)
    request.bitmap.close()
    self.postMessage({
      id: request.id,
      ok: true,
      result: { photoId: request.photoId, faceCount: landmarks.faceCount, landmarks },
    })
  } catch (error) {
    request.bitmap.close()
    self.postMessage({
      id: request.id,
      ok: false,
      error: error instanceof Error ? error.message : '本地人脸分析失败',
    })
  }
})
