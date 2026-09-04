import { ArrowCounterClockwise, ArrowUUpLeft, ArrowUUpRight, CrosshairSimple } from '@phosphor-icons/react'
import type { PlacementStep } from './usePointEditor'

const placementText: Record<Exclude<PlacementStep, undefined>, string> = {
  leftEye: '请点选左瞳孔中心',
  rightEye: '请点选右瞳孔中心',
  nose: '请点选鼻尖',
  complete: '三点已标记，可拖动微调',
}

export function OverlayControls({
  placement,
  canUndo,
  canRedo,
  dirty,
  onStart,
  onUndo,
  onRedo,
  onReset,
  onConfirm,
}: {
  placement: PlacementStep
  canUndo: boolean
  canRedo: boolean
  dirty: boolean
  onStart: () => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  onConfirm: () => void
}) {
  return (
    <div className="point-editor-bar">
      <div className="point-instruction" aria-live="polite">
        <CrosshairSimple size={18} aria-hidden="true" />
        <span>{placement ? placementText[placement] : '拖动定位点可精细校正'}</span>
      </div>
      <div className="point-editor-actions">
        <button type="button" className="text-button" onClick={onStart}>重新标记三点</button>
        <button type="button" className="icon-button" aria-label="撤销" disabled={!canUndo} onClick={onUndo}><ArrowUUpLeft size={18} /></button>
        <button type="button" className="icon-button" aria-label="重做" disabled={!canRedo} onClick={onRedo}><ArrowUUpRight size={18} /></button>
        <button type="button" className="icon-button" aria-label="重置定位点" onClick={onReset}><ArrowCounterClockwise size={18} /></button>
        <button type="button" className="secondary-button compact-button" disabled={!dirty} onClick={onConfirm}>确认此张</button>
      </div>
    </div>
  )
}
