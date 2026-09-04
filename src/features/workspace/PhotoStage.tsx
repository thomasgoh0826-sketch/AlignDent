import {
  ArrowsOutSimple,
  GridFour,
  ImageSquare,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  ArrowClockwise,
} from '@phosphor-icons/react'
import type { WorkspacePhoto } from '../../store/useWorkspaceStore'
import { PhotoCanvas } from '../editor/PhotoCanvas'
import type { LandmarkSet } from '../../domain/types'

export function PhotoStage({
  photo,
  gridVisible,
  viewMode,
  onToggleGrid,
  onViewMode,
  onConfirm,
  onLandmarksChange,
  onReanalyze,
  safeTop,
  safeBottom,
}: {
  photo: WorkspacePhoto
  gridVisible: boolean
  viewMode: 'original' | 'standard'
  onToggleGrid: () => void
  onViewMode: (mode: 'original' | 'standard') => void
  onConfirm: () => void
  onLandmarksChange: (landmarks: LandmarkSet) => void
  onReanalyze: () => void
  safeTop: number
  safeBottom: number
}) {
  return (
    <section className="photo-stage" aria-label="照片预览">
      <div className="stage-toolbar">
        <div className="segmented-control" aria-label="预览模式">
          <button
            type="button"
            className={viewMode === 'original' ? 'is-selected' : ''}
            onClick={() => onViewMode('original')}
          >
            原图
          </button>
          <button
            type="button"
            className={viewMode === 'standard' ? 'is-selected' : ''}
            onClick={() => onViewMode('standard')}
          >
            标准图
          </button>
        </div>
        <div className="toolbar-actions">
          <button className="toolbar-button" type="button" onClick={onReanalyze}><ArrowClockwise size={18} />重新识别</button>
          <button
            className="toolbar-button"
            type="button"
            aria-label="九宫格"
            aria-pressed={gridVisible}
            onClick={onToggleGrid}
          >
            <GridFour size={18} aria-hidden="true" />
            九宫格
          </button>
          <button className="icon-button stage-icon" type="button" aria-label="缩小">
            <MagnifyingGlassMinus size={19} />
          </button>
          <button className="icon-button stage-icon" type="button" aria-label="放大">
            <MagnifyingGlassPlus size={19} />
          </button>
          <button className="icon-button stage-icon" type="button" aria-label="适合窗口">
            <ArrowsOutSimple size={19} />
          </button>
        </div>
      </div>
      <div className="stage-surface">
        <div className="portrait-frame">
          {photo.previewUrl && photo.landmarks ? (
            <PhotoCanvas imageUrl={photo.previewUrl} detected={photo.landmarks} gridVisible={gridVisible} imageAlt={photo.isDemo ? '虚构演示人像' : `${photo.name} 预览`} isDemo={photo.isDemo} safeTop={safeTop} safeBottom={safeBottom} onChange={onLandmarksChange} onConfirm={onConfirm} />
          ) : photo.previewUrl ? (
            <img className="plain-preview" src={photo.previewUrl} alt={`${photo.name} 预览`} />
          ) : (
            <div className="unavailable-preview">
              <ImageSquare size={34} />
              <span>等待本地分析</span>
            </div>
          )}
        </div>
      </div>
      <div className="stage-status">
        <div>
          <strong>{photo.name}</strong>
          <span>{photo.error ?? '1600 × 2000 px'}</span>
        </div>
        <span className={`status-badge status-${photo.status}`}>
          {photo.status === 'ready' ? '已自动对齐' : photo.status === 'reviewed' ? '已人工确认' : photo.status === 'pending' ? '等待处理' : photo.status === 'analyzing' ? '本地识别中' : photo.status === 'failed' ? '处理失败' : '需要检查'}
        </span>
      </div>
    </section>
  )
}
