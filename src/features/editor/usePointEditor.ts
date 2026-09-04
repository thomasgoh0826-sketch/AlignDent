import { useCallback, useState } from 'react'
import type { LandmarkSet, NormalizedPoint } from '../../domain/types'

export type EditablePoint = 'leftEye' | 'rightEye' | 'nose'
export type PlacementStep = EditablePoint | 'complete' | undefined

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function usePointEditor(detected: LandmarkSet, onChange?: (value: LandmarkSet) => void) {
  const [points, setPoints] = useState(detected)
  const [history, setHistory] = useState<LandmarkSet[]>([])
  const [future, setFuture] = useState<LandmarkSet[]>([])
  const [placement, setPlacement] = useState<PlacementStep>()
  const [dirty, setDirty] = useState(false)

  const publish = useCallback((value: LandmarkSet) => {
    setPoints(value)
    onChange?.(value)
  }, [onChange])

  const updatePoint = useCallback((key: EditablePoint, point: NormalizedPoint) => {
    setPoints((current) => {
      const next = { ...current, [key]: { x: clamp(point.x), y: clamp(point.y) } }
      setHistory((items) => [...items.slice(-29), current])
      setFuture([])
      setDirty(true)
      onChange?.(next)
      return next
    })
  }, [onChange])

  const placeNext = useCallback((point: NormalizedPoint) => {
    if (!placement || placement === 'complete') return
    updatePoint(placement, point)
    setPlacement(placement === 'leftEye' ? 'rightEye' : placement === 'rightEye' ? 'nose' : 'complete')
  }, [placement, updatePoint])

  const undo = useCallback(() => {
    setHistory((items) => {
      const previous = items.at(-1)
      if (!previous) return items
      setFuture((nextItems) => [points, ...nextItems].slice(0, 30))
      publish(previous)
      return items.slice(0, -1)
    })
  }, [points, publish])

  const redo = useCallback(() => {
    setFuture((items) => {
      const next = items[0]
      if (!next) return items
      setHistory((previous) => [...previous.slice(-29), points])
      publish(next)
      return items.slice(1)
    })
  }, [points, publish])

  const reset = useCallback(() => {
    if (points !== detected) setHistory((items) => [...items.slice(-29), points])
    setFuture([])
    setDirty(false)
    setPlacement(undefined)
    publish(detected)
  }, [detected, points, publish])

  return {
    points,
    placement,
    dirty,
    canUndo: history.length > 0,
    canRedo: future.length > 0,
    startPlacement: () => setPlacement('leftEye'),
    placeNext,
    updatePoint,
    undo,
    redo,
    reset,
  }
}
