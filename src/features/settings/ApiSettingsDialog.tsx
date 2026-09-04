import { LockKey, X } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'

export function ApiSettingsDialog({ onClose }: { onClose: () => void }) {
  const [baseUrl, setBaseUrl] = useState('')
  const [model, setModel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [configured, setConfigured] = useState(false)
  const [status, setStatus] = useState('')

  useEffect(() => {
    void window.alignDent?.settings?.getApi().then((value) => {
      setBaseUrl(value.baseUrl)
      setModel(value.model)
      setConfigured(value.configured)
    })
  }, [])

  const save = async (event: FormEvent) => {
    event.preventDefault()
    if (!window.alignDent?.settings) {
      setStatus('请在 Windows 安装版中保存设置')
      return
    }
    await window.alignDent.settings.saveApi({ baseUrl, model, apiKey: apiKey || undefined })
    setStatus('设置已安全保存在本机')
    setConfigured(true)
    setApiKey('')
  }

  return <div className="modal-backdrop" role="presentation"><form className="command-dialog settings-dialog" role="dialog" aria-modal="true" aria-labelledby="api-title" onSubmit={save}>
    <div className="dialog-heading"><div><span className="task-kicker">可选功能</span><h2 id="api-title">文字 API 设置</h2></div><button className="icon-button" type="button" aria-label="关闭" onClick={onClose}><X size={18} /></button></div>
    <p className="privacy-callout"><LockKey size={19} weight="fill" /><span><strong>患者照片不会发送到 API</strong><small>只发送您输入的标准描述。不开启 API 时，内置离线识别仍可使用。</small></span></p>
    <label className="field-label">API 地址<input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} placeholder="https://api.example.com/v1" required /></label>
    <label className="field-label">模型名称<input value={model} onChange={(event) => setModel(event.target.value)} placeholder="模型名称" required /></label>
    <label className="field-label">API 密钥<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={configured ? '已保存，留空则不更改' : '输入购买方自己的密钥'} required={!configured} /></label>
    {status && <p className="settings-status" role="status">{status}</p>}
    <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button type="submit" className="primary-button">保存设置</button></div>
  </form></div>
}
