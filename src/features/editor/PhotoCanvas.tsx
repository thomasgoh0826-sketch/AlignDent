import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { LandmarkSet, NormalizedPoint } from '../../domain/types'
import { OverlayControls } from './OverlayControls'
import { usePointEditor, type EditablePoint } from './usePointEditor'

const labels: Record<EditablePoint, string> = {
  leftEye: '左瞳孔定位点',
  rightEye: '右瞳孔定位点',
  nose: '鼻尖定位点',
}

function normalizedPoint(event: PointerEvent<HTMLElement>, surface: HTMLElement): NormalizedPoint {
  const rect = surface.getBoundingClientRect()
  return {
    x: rect.width ? (event.clientX - rect.left) / rect.width : 0.5,
    y: rect.height ? (event.clientY - rect.top) / rect.height : 0.5,
  }
}

export function PhotoCanvas({
  imageUrl,
  detected,
  gridVisible = true,
  onChange,
  onConfirm,
  imageAlt = '患者照片',
  isDemo = false,
  safeTop = 0.08,
  safeBottom = 0.08,
}: {
  imageUrl: string
  detected: LandmarkSet
  gridVisible?: boolean
  onChange?: (value: LandmarkSet) => void
  onConfirm?: (value: LandmarkSet) => void
  imageAlt?: string
  isDemo?: boolean
  safeTop?: number
  safeBottom?: number
}) {
  const editor = usePointEditor(detected, onChange)
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<EditablePoint>()

  const onSurfaceDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget && !(event.target as HTMLElement).classList.contains('canvas-image')) return
    editor.placeNext(normalizedPoint(event, event.currentTarget))
  }

  const onSurfaceMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    editor.updatePoint(dragging, normalizedPoint(event, event.currentTarget))
  }

  const moveWithKeyboard = (key: EditablePoint, event: KeyboardEvent<HTMLButtonElement>) => {
    const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key]
    if (!direction) return
    event.preventDefault()
    const step = event.shiftKey ? 0.01 : 0.002
    const current = editor.points[key]
    editor.updatePoint(key, { x: current.x + direction[0] * step, y: current.y + direction[1] * step })
  }

  return (
    <div className="photo-canvas-wrap">
      <div
        ref={surfaceRef}
        className="photo-canvas-surface"
        data-testid="photo-canvas-surface"
        onPointerDown={onSurfaceDown}
        onPointerMove={onSurfaceMove}
        onPointerUp={() => setDragging(undefined)}
        onPointerCancel={() => setDragging(undefined)}
      >
        <img className="canvas-image" src={imageUrl} alt={imageAlt} draggable={false} />
        {gridVisible && <div className="alignment-grid" aria-hidden="true"><i className="grid-v one" /><i className="grid-v two" /><i className="grid-h one" /><i className="grid-h two" /><i className="eye-line" /><i className="face-center" /></div>}
        {gridVisible && <div className="safe-margin-guides" aria-hidden="true"><i style={{ top: `${safeTop * 100}%` }} /><i style={{ bottom: `${safeBottom * 100}%` }} /></div>}
        {(Object.keys(labels) as EditablePoint[]).map((key) => {
          const point = editor.points[key]
          return (
            <button
              key={key}
              type="button"
              className={`landmark-handle ${key}`}
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              aria-label={labels[key]}
              onPointerDown={(event) => { event.stopPropagation(); setDragging(key) }}
              onKeyDown={(event) => moveWithKeyboard(key, event)}
            />
          )
        })}
        {isDemo && <span className="demo-badge">虚构示例</span>}
      </div>
      <OverlayControls
        placement={editor.placement}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onStart={editor.startPlacement}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onReset={editor.reset}
        onConfirm={() => onConfirm?.(editor.points)}
      />
    </div>
  )
}
