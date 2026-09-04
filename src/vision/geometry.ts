import type { NormalizedPoint } from '../domain/types'

export function distance(a: NormalizedPoint, b: NormalizedPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

export function midpoint(a: NormalizedPoint, b: NormalizedPoint): NormalizedPoint {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  }
}

export function angleBetweenEyes(left: NormalizedPoint, right: NormalizedPoint) {
  return (Math.atan2(right.y - left.y, right.x - left.x) * 180) / Math.PI
}
