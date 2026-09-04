import { describe, expect, it } from 'vitest'
import { angleBetweenEyes, distance, midpoint } from '../../src/vision/geometry'

describe('face geometry', () => {
  it('reports a horizontal eye line as zero degrees', () => {
    expect(angleBetweenEyes({ x: 10, y: 20 }, { x: 30, y: 20 })).toBeCloseTo(0)
  })

  it('reports a descending eye line in image coordinates', () => {
    expect(angleBetweenEyes({ x: 10, y: 10 }, { x: 20, y: 20 })).toBeCloseTo(45)
  })

  it('calculates distance and midpoint without rounding', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    expect(midpoint({ x: 1, y: 3 }, { x: 5, y: 9 })).toEqual({ x: 3, y: 6 })
  })
})
