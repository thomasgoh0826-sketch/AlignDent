import { Tooth } from '@phosphor-icons/react'

export function Brand() {
  return (
    <div className="brand" aria-label="AlignDent 首页">
      <span className="brand-mark" aria-hidden="true">
        <Tooth size={22} weight="duotone" />
      </span>
      <span>
        <strong>AlignDent</strong>
        <small>牙科影像标准化</small>
      </span>
    </div>
  )
}
