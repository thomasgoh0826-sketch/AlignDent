import { CheckCircle, Copy, Key, ShieldCheck, X } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'

type ActivationResult = { ok: true } | { ok: false; reason?: string }

export function LicenseScreen({ deviceCode, onActivate, onClose }: {
  deviceCode: string
  onActivate: (token: string) => Promise<ActivationResult>
  onClose?: () => void
}) {
  const [token, setToken] = useState('')
  const [status, setStatus] = useState('')

  const activate = async (event: FormEvent) => {
    event.preventDefault()
    const result = await onActivate(token.trim())
    setStatus(result.ok ? '激活成功' : '授权码无效或不属于这台电脑')
  }

  return <div className="modal-backdrop" role="presentation"><form className="command-dialog license-dialog" role="dialog" aria-modal="true" aria-labelledby="license-title" onSubmit={activate}>
    <div className="dialog-heading"><div><span className="task-kicker">一次购买，本机使用</span><h2 id="license-title">激活 AlignDent</h2></div>{onClose && <button type="button" className="icon-button" aria-label="关闭" onClick={onClose}><X size={18} /></button>}</div>
    <div className="license-device"><ShieldCheck size={26} weight="duotone" /><span><small>本机设备码</small><strong>{deviceCode}</strong></span><button type="button" className="icon-button" aria-label="复制设备码" onClick={() => void navigator.clipboard?.writeText(deviceCode)}><Copy size={17} /></button></div>
    <p className="trial-note">未激活也可查看虚构示例，并可处理 3 张自己的照片。激活失败不会删除原图、任务或已导出的照片。</p>
    <label className="field-label">授权码<textarea aria-label="授权码" value={token} onChange={(event) => setToken(event.target.value)} placeholder="粘贴卖家发给您的授权码" required /></label>
    {status && <p className={status === '激活成功' ? 'activation-success' : 'activation-error'} role="status">{status === '激活成功' && <CheckCircle size={17} weight="fill" />}{status}</p>}
    <div className="dialog-actions"><button className="primary-button" type="submit"><Key size={18} />激活本机</button></div>
  </form></div>
}
