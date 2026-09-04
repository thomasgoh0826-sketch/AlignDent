import { CheckCircle, Circle, WarningCircle } from '@phosphor-icons/react'
import type { WorkspacePhoto } from '../../store/useWorkspaceStore'

function StatusIcon({ status }: { status: WorkspacePhoto['status'] }) {
  if (status === 'ready' || status === 'exported') return <CheckCircle size={17} weight="fill" />
  if (status === 'needs-review' || status === 'failed') return <WarningCircle size={17} weight="fill" />
  return <Circle size={17} />
}

export function PhotoQueue({
  photos,
  activeId,
  onSelect,
}: {
  photos: readonly WorkspacePhoto[]
  activeId?: string
  onSelect: (id: string) => void
}) {
  return (
    <section className="photo-queue" aria-label="照片队列">
      <div className="queue-heading">
        <strong>{photos.length} 张照片</strong>
        <span>{photos.filter((photo) => photo.status === 'ready').length} 张可导出</span>
      </div>
      <div className="queue-list">
        {photos.map((photo) => (
          <button
            type="button"
            key={photo.id}
            className={activeId === photo.id ? 'queue-item is-active' : 'queue-item'}
            onClick={() => onSelect(photo.id)}
          >
            <span className="queue-thumbnail">
              {photo.previewUrl ? <img src={photo.previewUrl} alt="" /> : <span aria-hidden="true">IMG</span>}
            </span>
            <span className="queue-name">{photo.name}</span>
            <span className={`queue-status status-${photo.status}`} aria-label={photo.status}>
              <StatusIcon status={photo.status} />
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
