import type {
  AffineMatrix,
  DentalTemplate,
  LandmarkSet,
  NormalizedPoint,
  ReviewReason,
  TransformPlan,
} from '../domain/types'
import { angleBetweenEyes, distance, midpoint } from './geometry'

type PlanInput = Readonly<{
  sourceWidth: number
  sourceHeight: number
  landmarks: LandmarkSet
  template: DentalTemplate
  confidenceThreshold?: number
}>

function toPixels(point: NormalizedPoint, width: number, height: number): NormalizedPoint {
  return { x: point.x * width, y: point.y * height }
}

export function applyTransform(matrix: AffineMatrix, point: NormalizedPoint): NormalizedPoint {
  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.tx,
    y: matrix.b * point.x + matrix.d * point.y + matrix.ty,
  }
}

function invertTransform(matrix: AffineMatrix, point: NormalizedPoint): NormalizedPoint {
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c
  if (Math.abs(determinant) < Number.EPSILON) {
    return { x: Number.NaN, y: Number.NaN }
  }

  const x = point.x - matrix.tx
  const y = point.y - matrix.ty
  return {
    x: (matrix.d * x - matrix.c * y) / determinant,
    y: (-matrix.b * x + matrix.a * y) / determinant,
  }
}

export function planTransform({
  sourceWidth,
  sourceHeight,
  landmarks,
  template,
  confidenceThreshold = 0.65,
}: PlanInput): TransformPlan {
  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error('源图片尺寸无效')
  }

  const leftEye = toPixels(landmarks.leftEye, sourceWidth, sourceHeight)
  const rightEye = toPixels(landmarks.rightEye, sourceWidth, sourceHeight)
  const nose = toPixels(landmarks.nose, sourceWidth, sourceHeight)
  const eyeMidpoint = midpoint(leftEye, rightEye)
  const sourceEyeDistance = distance(leftEye, rightEye)
  const targetEyeDistance = template.outputWidth * template.targetEyeDistanceRatio
  const rotationDegrees = -angleBetweenEyes(leftEye, rightEye)
  const radians = (rotationDegrees * Math.PI) / 180
  const unitCosine = Math.cos(radians)
  const unitSine = Math.sin(radians)
  const rotatedFace = landmarks.faceOval.map((point) => {
    const source = toPixels(point, sourceWidth, sourceHeight)
    return { x: unitCosine * source.x - unitSine * source.y, y: unitSine * source.x + unitCosine * source.y }
  })
  const faceTop = rotatedFace.length >= 2 ? Math.min(...rotatedFace.map((point) => point.y)) : undefined
  const faceBottom = rotatedFace.length >= 2 ? Math.max(...rotatedFace.map((point) => point.y)) : undefined
  const faceLeft = rotatedFace.length >= 2 ? Math.min(...rotatedFace.map((point) => point.x)) : undefined
  const faceRight = rotatedFace.length >= 2 ? Math.max(...rotatedFace.map((point) => point.x)) : undefined
  const faceHeight = faceTop === undefined || faceBottom === undefined ? 0 : faceBottom - faceTop
  const targetFaceHeight = template.outputHeight * (1 - template.safeTop - template.safeBottom)
  const scale = faceHeight > 0 ? targetFaceHeight / faceHeight : sourceEyeDistance > 0 ? targetEyeDistance / sourceEyeDistance : 1
  const cosine = unitCosine * scale
  const sine = unitSine * scale

  const linearMatrix: AffineMatrix = {
    a: cosine,
    b: sine,
    c: -sine,
    d: cosine,
    tx: 0,
    ty: 0,
  }
  const targetEyeY = template.eyeLineY * template.outputHeight
  const transformedEyeMidpoint = applyTransform(linearMatrix, eyeMidpoint)
  const transformedNose = applyTransform(linearMatrix, nose)
  const transformedFaceCenterX = faceLeft === undefined || faceRight === undefined
    ? (transformedEyeMidpoint.x + transformedNose.x) / 2
    : ((faceLeft + faceRight) / 2) * scale
  const matrix: AffineMatrix = {
    ...linearMatrix,
    tx: template.noseX * template.outputWidth - transformedFaceCenterX,
    ty: faceTop === undefined
      ? targetEyeY - transformedEyeMidpoint.y
      : template.safeTop * template.outputHeight - faceTop * scale,
  }

  const reviewReasons: ReviewReason[] = []
  if (landmarks.faceCount === 0) reviewReasons.push('no-face')
  if (landmarks.faceCount > 1) reviewReasons.push('multiple-faces')
  if (landmarks.confidence < confidenceThreshold) reviewReasons.push('low-confidence')
  if (sourceEyeDistance / sourceWidth < 0.08) reviewReasons.push('face-too-small')

  const mappedNose = applyTransform(matrix, nose)
  if (Math.abs(mappedNose.y / template.outputHeight - template.noseY) > 0.14) {
    reviewReasons.push('nose-position-mismatch')
  }

  const outputCorners = [
    { x: 0, y: 0 },
    { x: template.outputWidth, y: 0 },
    { x: template.outputWidth, y: template.outputHeight },
    { x: 0, y: template.outputHeight },
  ]
  const sourceHasCoverage = outputCorners
    .map((corner) => invertTransform(matrix, corner))
    .every(
      (corner) =>
        corner.x >= -1 &&
        corner.x <= sourceWidth + 1 &&
        corner.y >= -1 &&
        corner.y <= sourceHeight + 1,
    )
  if (!sourceHasCoverage) reviewReasons.push('insufficient-source-coverage')

  return {
    matrix,
    rotationDegrees,
    scale,
    outputWidth: template.outputWidth,
    outputHeight: template.outputHeight,
    requiresManualReview: reviewReasons.length > 0,
    reviewReasons,
  }
}
