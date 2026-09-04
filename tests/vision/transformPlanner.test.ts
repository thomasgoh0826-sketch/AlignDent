import { describe, expect, it } from 'vitest'
import { BUILT_IN_TEMPLATES } from '../../src/domain/templates'
import type { LandmarkSet } from '../../src/domain/types'
import { applyTransform, planTransform } from '../../src/vision/transformPlanner'

const template = BUILT_IN_TEMPLATES[1]

function landmarks(overrides: Partial<LandmarkSet> = {}): LandmarkSet {
  return {
    leftEye: { x: 0.35, y: 0.3 },
    rightEye: { x: 0.65, y: 0.3 },
    nose: { x: 0.5, y: 0.47 },
    faceOval: [],
    confidence: 0.94,
    faceCount: 1,
    ...overrides,
  }
}

describe('transform planner', () => {
  it('maps the eye line and nose center into the selected 4:5 template', () => {
    const result = planTransform({
      sourceWidth: 2000,
      sourceHeight: 3000,
      landmarks: landmarks(),
      template,
    })

    const eyeMidpoint = applyTransform(result.matrix, { x: 1000, y: 900 })
    const mappedNose = applyTransform(result.matrix, { x: 1000, y: 1410 })

    expect(result.rotationDegrees).toBeCloseTo(0)
    expect(result.scale).toBeCloseTo(608 / 600)
    expect(eyeMidpoint.y).toBeCloseTo(2000 / 3)
    expect(mappedNose.x).toBeCloseTo(800)
    expect(result.requiresManualReview).toBe(false)
    expect(result.reviewReasons).toEqual([])
  })

  it('returns the opposite rotation required to straighten tilted eyes', () => {
    const result = planTransform({
      sourceWidth: 2000,
      sourceHeight: 3000,
      landmarks: landmarks({
        leftEye: { x: 0.35, y: 0.29 },
        rightEye: { x: 0.65, y: 0.31 },
      }),
      template,
    })

    expect(result.rotationDegrees).toBeLessThan(0)
  })

  it('uses one uniform transform to level pupils and lock face top and chin margins', () => {
    const source = landmarks({
      leftEye: { x: 0.34, y: 0.3 },
      rightEye: { x: 0.66, y: 0.34 },
      nose: { x: 0.5, y: 0.5 },
      faceOval: [{ x: 0.5, y: 0.12 }, { x: 0.5, y: 0.88 }],
    })
    const result = planTransform({ sourceWidth: 2000, sourceHeight: 3000, landmarks: source, template })
    const leftEye = applyTransform(result.matrix, { x: source.leftEye.x * 2000, y: source.leftEye.y * 3000 })
    const rightEye = applyTransform(result.matrix, { x: source.rightEye.x * 2000, y: source.rightEye.y * 3000 })
    const faceTop = applyTransform(result.matrix, { x: 1000, y: 360 })
    const chin = applyTransform(result.matrix, { x: 1000, y: 2640 })

    expect(leftEye.y).toBeCloseTo(rightEye.y)
    expect(Math.min(faceTop.y, chin.y)).toBeCloseTo(template.safeTop * template.outputHeight)
    expect(Math.max(faceTop.y, chin.y)).toBeCloseTo((1 - template.safeBottom) * template.outputHeight)
    expect(result.matrix.a).toBeCloseTo(result.matrix.d)
    expect(result.matrix.b).toBeCloseTo(-result.matrix.c)
  })

  it('centers the facial midline instead of centering only the nose', () => {
    const source = landmarks({
      leftEye: { x: 0.29, y: 0.3 },
      rightEye: { x: 0.59, y: 0.3 },
      nose: { x: 0.47, y: 0.5 },
      faceOval: [
        { x: 0.2, y: 0.15 },
        { x: 0.68, y: 0.15 },
        { x: 0.72, y: 0.85 },
        { x: 0.16, y: 0.85 },
      ],
    })
    const result = planTransform({ sourceWidth: 2000, sourceHeight: 3000, landmarks: source, template })
    const leftEdge = applyTransform(result.matrix, { x: 320, y: 2550 })
    const rightEdge = applyTransform(result.matrix, { x: 1440, y: 2550 })

    expect((leftEdge.x + rightEdge.x) / 2).toBeCloseTo(template.outputWidth / 2)
  })

  it('requires review for multiple faces, low confidence, or a tiny face', () => {
    const result = planTransform({
      sourceWidth: 2000,
      sourceHeight: 3000,
      landmarks: landmarks({
        leftEye: { x: 0.48, y: 0.3 },
        rightEye: { x: 0.52, y: 0.3 },
        confidence: 0.4,
        faceCount: 2,
      }),
      template,
    })

    expect(result.requiresManualReview).toBe(true)
    expect(result.reviewReasons).toEqual(
      expect.arrayContaining(['multiple-faces', 'low-confidence', 'face-too-small']),
    )
  })
})
