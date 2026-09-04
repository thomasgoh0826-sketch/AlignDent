import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StandardPreview } from '../../src/features/editor/StandardPreview'
import type { LandmarkSet, TransformPlan } from '../../src/domain/types'

const landmarks: LandmarkSet = {
  leftEye: { x: 0.35, y: 0.32 },
  rightEye: { x: 0.65, y: 0.34 },
  nose: { x: 0.5, y: 0.52 },
  faceOval: [],
  confidence: 0.95,
  faceCount: 1,
}

const plan: TransformPlan = {
  matrix: { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 },
  rotationDegrees: -3.2,
  scale: 1,
  outputWidth: 1600,
  outputHeight: 2000,
  requiresManualReview: true,
  reviewReasons: ['insufficient-source-coverage'],
}

describe('standardized preview', () => {
  it('warns instead of claiming success when the source has insufficient edge coverage', () => {
    render(<StandardPreview imageUrl="portrait.jpg" imageAlt="患者照片" sourceWidth={1600} sourceHeight={2000} landmarks={landmarks} plan={plan} gridVisible safeTop={0.08} safeBottom={0.08} isDemo={false} onEdit={vi.fn()} />)

    expect(screen.getByText('原图边缘不足，请换一张拍摄范围更大的照片')).toBeVisible()
  })
})
