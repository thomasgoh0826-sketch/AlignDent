import { DownloadSimple, Info, X } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'

export function UrlImportDialog({ onClose, onDownload }: { onClose: () => void; onDownload: (urls: string[]) => Promise<string[]> }) {
  const [value, setValue] = useState('')
  const [status, setStatus] = useState('')
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const urls = value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    if (!urls.length) return
    setStatus('正在下载，请稍候')
    try {
      await onDownload(urls)
      setStatus('下载完成')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '下载失败，请检查直链')
    }
  }
  return <div className="modal-backdrop" role="presentation"><form className="command-dialog url-dialog" role="dialog" aria-modal="true" aria-labelledby="url-title" onSubmit={submit}>
    <div className="dialog-heading"><div><span className="task-kicker">批量获取</span><h2 id="url-title">从图片链接导入</h2></div><button type="button" className="icon-button" aria-label="关闭" onClick={onClose}><X size={18} /></button></div>
    <p className="url-safety"><Info size={18} weight="fill" />仅支持可直接打开的 JPG、PNG、WebP 链接，不绕过平台登录或访问限制。</p>
    <label className="field-label">每行一个图片链接<textarea aria-label="图片链接" value={value} onChange={(event) => setValue(event.target.value)} placeholder={'https://example.com/photo-1.jpg\nhttps://example.com/photo-2.jpg'} required /></label>
    {status && <p className="settings-status" role="status">{status}</p>}
    <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button type="submit" className="primary-button"><DownloadSimple size={18} />下载并导入</button></div>
  </form></div>
}
