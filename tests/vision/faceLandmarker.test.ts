import { describe, expect, it } from 'vitest'
import { detectPrimaryFace } from '../../src/vision/faceLandmarker'

type Point = { x: number; y: number; z?: number }

function face(centerX: number, centerY: number, size: number): Point[] {
  const points = Array.from({ length: 478 }, () => ({ x: centerX, y: centerY, z: 0 }))
  for (let index = 0; index < points.length; index += 1) {
    const angle = (index / points.length) * Math.PI * 2
    points[index] = {
      x: centerX + Math.cos(angle) * size,
      y: centerY + Math.sin(angle) * size,
      z: 0,
    }
  }
  for (const index of [33, 133, 159, 145]) points[index] = { x: centerX - size * 0.38, y: centerY - size * 0.18, z: 0 }
  for (const index of [362, 263, 386, 374]) points[index] = { x: centerX + size * 0.38, y: centerY - size * 0.18, z: 0 }
  points[468] = { x: centerX - size * 0.34, y: centerY - size * 0.16, z: 0 }
  points[473] = { x: centerX + size * 0.34, y: centerY - size * 0.16, z: 0 }
  points[1] = { x: centerX, y: centerY + size * 0.18, z: 0 }
  return points
}

describe('MediaPipe face landmark adapter', () => {
  it('extracts ordered eyes, nose, oval, and face count', async () => {
    const detector = {
      detect: () => ({ faceLandmarks: [face(0.5, 0.5, 0.35)] }),
    }

    const result = await detectPrimaryFace({} as ImageBitmap, detector)

    expect(result.faceCount).toBe(1)
    expect(result.leftEye.x).toBeLessThan(result.rightEye.x)
    expect(result.leftEye.y).toBeCloseTo(0.5 - 0.35 * 0.16)
    expect(result.nose).toEqual(expect.objectContaining({ x: 0.5 }))
    expect(result.faceOval.length).toBeGreaterThan(20)
    expect(result.confidence).toBe(1)
  })

  it('chooses the largest detected face but reports every face', async () => {
    const detector = {
      detect: () => ({ faceLandmarks: [face(0.2, 0.2, 0.08), face(0.6, 0.5, 0.3)] }),
    }

    const result = await detectPrimaryFace({} as ImageBitmap, detector)

    expect(result.faceCount).toBe(2)
    expect(result.nose.x).toBeCloseTo(0.6)
  })

  it('returns an explicit empty result when no face is detected', async () => {
    const detector = { detect: () => ({ faceLandmarks: [] }) }

    const result = await detectPrimaryFace({} as ImageBitmap, detector)

    expect(result.faceCount).toBe(0)
    expect(result.confidence).toBe(0)
  })
})
