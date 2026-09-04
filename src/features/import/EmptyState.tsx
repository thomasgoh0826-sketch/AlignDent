import { FolderOpen, ImageSquare, LinkSimple } from '@phosphor-icons/react'

export function EmptyState({
  onImport,
  onImportFolder,
  onDemo,
  onUrlImport,
}: {
  onImport: () => void
  onImportFolder: () => void
  onDemo: () => void
  onUrlImport: () => void
}) {
  return (
    <section className="empty-state" aria-labelledby="empty-title">
      <div className="empty-visual" aria-hidden="true">
        <div className="empty-photo rear" />
        <div className="empty-photo front">
          <ImageSquare size={32} weight="duotone" />
        </div>
      </div>
      <p className="section-label">新建标准化任务</p>
      <h2 id="empty-title">从一批患者照片开始</h2>
      <p>自动摆正头位、统一面部位置，并按同一模板批量导出。原图不会被修改。</p>
      <div className="empty-actions">
        <button className="primary-button" type="button" onClick={onImport}>
          <ImageSquare size={19} weight="bold" aria-hidden="true" />
          导入照片
        </button>
        <button className="secondary-button" type="button" onClick={onImportFolder}>
          <FolderOpen size={19} aria-hidden="true" />
          选择文件夹
        </button>
      </div>
      <button className="text-button" type="button" onClick={onDemo}>
        查看示例
      </button>
      <button className="link-hint" type="button" onClick={onUrlImport}>
        <LinkSimple size={17} aria-hidden="true" />
        也可以从链接批量导入
      </button>
    </section>
  )
}
