import type { LandmarkSet, NormalizedPoint, TransformPlan } from '../../domain/types'
import { applyTransform } from '../../vision/transformPlanner'

function outputPoint(
  point: NormalizedPoint,
  sourceWidth: number,
  sourceHeight: number,
  plan: TransformPlan,
) {
  const mapped = applyTransform(plan.matrix, {
    x: point.x * sourceWidth,
    y: point.y * sourceHeight,
  })
  return {
    x: mapped.x / plan.outputWidth,
    y: mapped.y / plan.outputHeight,
  }
}

export function StandardPreview({
  imageUrl,
  imageAlt,
  sourceWidth,
  sourceHeight,
  landmarks,
  plan,
  gridVisible,
  safeTop,
  safeBottom,
  isDemo,
  onEdit,
}: {
  imageUrl: string
  imageAlt: string
  sourceWidth: number
  sourceHeight: number
  landmarks: LandmarkSet
  plan: TransformPlan
  gridVisible: boolean
  safeTop: number
  safeBottom: number
  isDemo: boolean
  onEdit: () => void
}) {
  const points = {
    leftEye: outputPoint(landmarks.leftEye, sourceWidth, sourceHeight, plan),
    rightEye: outputPoint(landmarks.rightEye, sourceWidth, sourceHeight, plan),
    nose: outputPoint(landmarks.nose, sourceWidth, sourceHeight, plan),
  }
  const { a, b, c, d, tx, ty } = plan.matrix
  const rotation = Math.abs(plan.rotationDegrees) < 0.05
    ? '无需旋转'
    : `已旋转 ${Math.abs(plan.rotationDegrees).toFixed(1)}°`
  const insufficientCoverage = plan.reviewReasons.includes('insufficient-source-coverage')

  return (
    <div className="photo-canvas-wrap">
      <div className="photo-canvas-surface standard-preview-surface">
        <svg
          className="standardized-image"
          data-testid="standardized-image"
          role="img"
          aria-label={imageAlt}
          viewBox={`0 0 ${plan.outputWidth} ${plan.outputHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="100%" height="100%" fill="#ffffff" />
          <image
            data-testid="standardized-image-source"
            href={imageUrl}
            width={sourceWidth}
            height={sourceHeight}
            preserveAspectRatio="none"
            transform={`matrix(${a} ${b} ${c} ${d} ${tx} ${ty})`}
          />
        </svg>
        {gridVisible && <div className="alignment-grid" aria-hidden="true"><i className="grid-v one" /><i className="grid-v two" /><i className="grid-h one" /><i className="grid-h two" /><i className="eye-line" /><i className="face-center" /></div>}
        {gridVisible && <div className="safe-margin-guides" aria-hidden="true"><i style={{ top: `${safeTop * 100}%` }} /><i style={{ bottom: `${safeBottom * 100}%` }} /></div>}
        <span className="standard-landmark left-eye" style={{ left: `${points.leftEye.x * 100}%`, top: `${points.leftEye.y * 100}%` }} aria-hidden="true" />
        <span className="standard-landmark right-eye" style={{ left: `${points.rightEye.x * 100}%`, top: `${points.rightEye.y * 100}%` }} aria-hidden="true" />
        <span className="standard-landmark nose" style={{ left: `${points.nose.x * 100}%`, top: `${points.nose.y * 100}%` }} aria-hidden="true" />
        {isDemo && <span className="demo-badge">虚构示例</span>}
      </div>
      <div className={`standard-result-bar ${insufficientCoverage ? 'is-warning' : ''}`}>
        {insufficientCoverage
          ? <span>原图边缘不足，请换一张拍摄范围更大的照片</span>
          : <span><b>{rotation}</b> · 双瞳已水平 · 面中线已居中</span>}
        <button type="button" className="secondary-button compact-button" onClick={onEdit}>调整定位点</button>
      </div>
    </div>
  )
}
