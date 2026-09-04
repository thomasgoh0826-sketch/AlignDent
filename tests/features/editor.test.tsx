import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { LandmarkSet } from '../../src/domain/types'
import { PhotoCanvas } from '../../src/features/editor/PhotoCanvas'

const detected: LandmarkSet = {
  leftEye: { x: 0.35, y: 0.34 },
  rightEye: { x: 0.65, y: 0.34 },
  nose: { x: 0.5, y: 0.52 },
  faceOval: [],
  confidence: 0.98,
  faceCount: 1,
}

describe('three-point correction editor', () => {
  it('guides left eye, right eye, then nose placement', async () => {
    const user = userEvent.setup()
    render(<PhotoCanvas imageUrl="/demo/demo-portrait.png" detected={detected} />)

    await user.click(screen.getByRole('button', { name: '重新标记三点' }))
    expect(screen.getByText('请点选左瞳孔中心')).toBeVisible()

    const surface = screen.getByTestId('photo-canvas-surface')
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 1000,
      width: 1000, height: 1000, toJSON: () => ({}),
    })
    fireEvent.pointerDown(surface, { clientX: 300, clientY: 320 })
    expect(screen.getByText('请点选右瞳孔中心')).toBeVisible()
    fireEvent.pointerDown(surface, { clientX: 700, clientY: 320 })
    expect(screen.getByText('请点选鼻尖')).toBeVisible()
    fireEvent.pointerDown(surface, { clientX: 500, clientY: 540 })
    expect(screen.getByText('三点已标记，可拖动微调')).toBeVisible()
  })

  it('drags a point in normalized coordinates and supports undo and reset', () => {
    const onChange = vi.fn()
    render(<PhotoCanvas imageUrl="/demo/demo-portrait.png" detected={detected} onChange={onChange} />)

    const surface = screen.getByTestId('photo-canvas-surface')
    vi.spyOn(surface, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 1000,
      width: 1000, height: 1000, toJSON: () => ({}),
    })
    const leftEye = screen.getByRole('button', { name: '左瞳孔定位点' })
    fireEvent.pointerDown(leftEye, { pointerId: 1 })
    fireEvent.pointerMove(surface, { pointerId: 1, clientX: 400, clientY: 360 })
    fireEvent.pointerUp(surface, { pointerId: 1 })
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ leftEye: { x: 0.4, y: 0.36 } }))

    fireEvent.click(screen.getByRole('button', { name: '撤销' }))
    expect(onChange).toHaveBeenLastCalledWith(detected)
    fireEvent.click(screen.getByRole('button', { name: '重置定位点' }))
    expect(onChange).toHaveBeenLastCalledWith(detected)
  })

  it('marks manual edits reviewed only after explicit confirmation', () => {
    const onConfirm = vi.fn()
    render(<PhotoCanvas imageUrl="/demo/demo-portrait.png" detected={detected} onConfirm={onConfirm} />)

    fireEvent.keyDown(screen.getByRole('button', { name: '鼻尖定位点' }), { key: 'ArrowRight' })
    expect(onConfirm).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '确认此张' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('allows confirming the automatically detected points without requiring a manual edit', () => {
    const onConfirm = vi.fn()
    render(<PhotoCanvas imageUrl="/demo/demo-portrait.png" detected={detected} onConfirm={onConfirm} />)

    const confirmButton = screen.getByRole('button', { name: '确认此张' })
    expect(confirmButton).toBeEnabled()
    fireEvent.click(confirmButton)
    expect(onConfirm).toHaveBeenCalledWith(detected)
  })

  it('disables confirmation only while a new three-point placement is incomplete', async () => {
    const user = userEvent.setup()
    render(<PhotoCanvas imageUrl="/demo/demo-portrait.png" detected={detected} />)

    await user.click(screen.getByRole('button', { name: '重新标记三点' }))
    expect(screen.getByRole('button', { name: '确认此张' })).toBeDisabled()
  })
})
