import { CaretDown, Export, Info, SlidersHorizontal } from '@phosphor-icons/react'
import type { WorkspacePhoto } from '../../store/useWorkspaceStore'
import type { DentalTemplate } from '../../domain/types'

export function Inspector({ photos, template, onRatio, onTemplateValue, processing, progress, onPrimary, onCancel }: {
  photos: readonly WorkspacePhoto[]
  template: DentalTemplate
  onRatio: (ratio: DentalTemplate['ratio']) => void
  onTemplateValue: (field: 'outputWidth' | 'eyeLineY' | 'noseX', value: number) => void
  processing: boolean
  progress: { done: number; total: number }
  onPrimary: () => void
  onCancel: () => void
}) {
  const readyCount = photos.filter((photo) => photo.status === 'ready' || photo.status === 'reviewed').length
  const hasPending = photos.some((photo) => photo.status === 'pending')
  const primaryLabel = processing ? `取消处理 ${progress.done}/${progress.total}` : hasPending ? '开始处理' : `导出 ${readyCount} 张`

  return (
    <aside className="inspector" aria-label="输出标准">
      <div className="inspector-heading">
        <div>
          <span className="task-kicker">当前模板</span>
          <h2>牙科正面照</h2>
        </div>
        <button className="icon-button" type="button" aria-label="更多模板">
          <CaretDown size={18} />
        </button>
      </div>

      <div className="inspector-section">
        <h3><SlidersHorizontal size={18} /> 输出尺寸</h3>
        <label className="field-label">
          图片比例
          <select value={template.ratio} onChange={(event) => onRatio(event.target.value as DentalTemplate['ratio'])}>
            <option>1:1</option>
            <option>4:5</option>
            <option>3:4</option>
            <option>2:3</option>
          </select>
        </label>
        <div className="field-row">
          <label className="field-label">
            宽度
            <span className="number-field"><input type="number" value={template.outputWidth} min="320" max="8000" onChange={(event) => onTemplateValue('outputWidth', Number(event.target.value))} /><em>px</em></span>
          </label>
          <label className="field-label">
            高度
            <span className="number-field"><input type="number" value={template.outputHeight} readOnly /><em>px</em></span>
          </label>
        </div>
      </div>

      <div className="inspector-section">
        <h3>面部位置</h3>
        <label className="range-field">
          <span><b>眼线高度</b><output>{Math.round(template.eyeLineY * 100)}%</output></span>
          <input type="range" min="20" max="62" value={Math.round(template.eyeLineY * 100)} onChange={(event) => onTemplateValue('eyeLineY', Number(event.target.value) / 100)} />
        </label>
        <label className="range-field">
          <span><b>鼻尖位置</b><output>{template.noseX === 0.5 ? '居中' : `${Math.round(template.noseX * 100)}%`}</output></span>
          <input type="range" min="30" max="70" value={Math.round(template.noseX * 100)} onChange={(event) => onTemplateValue('noseX', Number(event.target.value) / 100)} />
        </label>
      </div>

      <div className="inspector-section compact">
        <h3>构图约束</h3>
        <ul className="constraint-list">
          <li><span />等比例校正，不拉伸</li>
          <li><span />双眼瞳孔保持水平</li>
          <li><span />面中线与图片中线重合</li>
          <li><span />上下边距 {Math.round(template.safeTop * 100)}% / {Math.round(template.safeBottom * 100)}%</li>
        </ul>
      </div>

      <div className="inspector-section compact">
        <h3>导出格式</h3>
        <label className="field-label">
          文件类型
          <select defaultValue="JPG 高质量">
            <option>JPG 高质量</option>
            <option>PNG 无损</option>
          </select>
        </label>
      </div>

      <div className="inspector-footer">
        {processing && <div className="batch-progress"><span style={{ width: `${progress.total ? progress.done / progress.total * 100 : 0}%` }} /></div>}
        <div className="safe-export-note">
          <Info size={17} weight="fill" aria-hidden="true" />
          <span>导出到新文件夹，不覆盖原图</span>
        </div>
        <button className="primary-button inspector-primary" type="button" onClick={processing ? onCancel : onPrimary}>
          {hasPending ? <SlidersHorizontal size={19} weight="bold" /> : <Export size={19} weight="bold" />}
          {primaryLabel}
        </button>
      </div>
    </aside>
  )
}
