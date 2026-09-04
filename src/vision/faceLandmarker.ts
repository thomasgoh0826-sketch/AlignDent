import type { ImageSource } from '@mediapipe/tasks-vision'
import type { LandmarkSet, NormalizedPoint } from '../domain/types'

type RawPoint = Readonly<{ x: number; y: number; z?: number }>

export type FaceLandmarkerResultLike = Readonly<{
  faceLandmarks: readonly (readonly RawPoint[])[]
}>

export type FaceDetectorLike = Readonly<{
  detect: (image: ImageSource) => FaceLandmarkerResultLike | Promise<FaceLandmarkerResultLike>
}>

const eyeAIndices = [33, 133, 159, 145]
const eyeBIndices = [362, 263, 386, 374]
const faceOvalIndices = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
  379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
  234, 127, 162, 21, 54, 103, 67, 109,
]

function average(points: readonly RawPoint[], indices: readonly number[]): NormalizedPoint {
  const selected = indices.map((index) => points[index]).filter(Boolean)
  if (selected.length === 0) return { x: 0.5, y: 0.5 }
  const sum = selected.reduce(
    (total, point) => ({ x: total.x + point.x, y: total.y + point.y }),
    { x: 0, y: 0 },
  )
  return { x: sum.x / selected.length, y: sum.y / selected.length }
}

function faceArea(points: readonly RawPoint[]) {
  if (points.length === 0) return 0
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
}

function emptyLandmarks(): LandmarkSet {
  const center = { x: 0.5, y: 0.5 }
  return {
    leftEye: center,
    rightEye: center,
    nose: center,
    faceOval: [],
    confidence: 0,
    faceCount: 0,
  }
}

export async function detectPrimaryFace(
  image: ImageSource,
  detector: FaceDetectorLike,
): Promise<LandmarkSet> {
  const result = await detector.detect(image)
  if (result.faceLandmarks.length === 0) return emptyLandmarks()

  const primaryFace = [...result.faceLandmarks].sort(
    (left, right) => faceArea(right) - faceArea(left),
  )[0]
  const eyeA = average(primaryFace, eyeAIndices)
  const eyeB = average(primaryFace, eyeBIndices)
  const irisA = primaryFace[468]
  const irisB = primaryFace[473]
  const eyePoints = irisA && irisB
    ? [{ x: irisA.x, y: irisA.y }, { x: irisB.x, y: irisB.y }]
    : [eyeA, eyeB]
  const [leftEye, rightEye] = eyePoints[0].x <= eyePoints[1].x ? eyePoints : [eyePoints[1], eyePoints[0]]
  const nosePoint = primaryFace[1]

  return {
    leftEye,
    rightEye,
    nose: nosePoint ? { x: nosePoint.x, y: nosePoint.y } : { x: 0.5, y: 0.5 },
    faceOval: faceOvalIndices
      .map((index) => primaryFace[index])
      .filter(Boolean)
      .map((point) => ({ x: point.x, y: point.y })),
    confidence: 1,
    faceCount: result.faceLandmarks.length,
  }
}
