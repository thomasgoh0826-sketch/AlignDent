import { CheckCircle, Command, Sparkle, WarningCircle, X } from '@phosphor-icons/react'
import { useState, type FormEvent } from 'react'
import { parseOfflineCommand } from '../../domain/commandParser'
import type { CommandParseResult, CommandPatch } from '../../domain/types'

function describePatch(patch: CommandPatch) {
  const items: string[] = []
  if (patch.straighten) items.push('自动摆正头位')
  if (patch.ratio) items.push(`输出比例 ${patch.ratio}`)
  if (patch.eyeLineY) items.push(`眼线高度 ${Math.round(patch.eyeLineY * 100)}%`)
  if (patch.outputWidth) items.push(`输出宽度 ${patch.outputWidth} 像素`)
  if (patch.noseX === 0.5) items.push('鼻尖水平居中')
  return items
}

export function CommandComposer({ onApply }: { onApply: (patch: CommandPatch) => void }) {
  const [command, setCommand] = useState('')
  const [result, setResult] = useState<CommandParseResult>()

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!command.trim()) return
    const offline = parseOfflineCommand(command)
    const remote = window.alignDent?.api
    if (!remote) {
      setResult(offline)
      return
    }
    const parsed = await remote.parseCommand(command)
    if (parsed.source === 'offline') {
      setResult(offline)
      return
    }
    const patch = parsed.patch as CommandPatch
    setResult({ patch, recognized: describePatch(patch), unrecognized: [] })
  }

  const confirm = () => {
    if (!result) return
    onApply(result.patch)
    setResult(undefined)
    setCommand('')
  }

  return (
    <>
      <form className="command-field" onSubmit={submit}>
        <Sparkle size={18} weight="duotone" aria-hidden="true" />
        <label className="sr-only" htmlFor="standard-command">处理标准</label>
        <input id="standard-command" value={command} onChange={(event) => setCommand(event.target.value)} placeholder="例如：摆正头位，眼睛放在上方三分线，裁成 4:5" />
        <span className="command-key" aria-hidden="true"><Command size={13} /> Enter</span>
      </form>
      {result && (
        <div className="modal-backdrop" role="presentation">
          <section className="command-dialog" role="dialog" aria-modal="true" aria-labelledby="command-dialog-title">
            <div className="dialog-heading">
              <div><span className="task-kicker">应用前检查</span><h2 id="command-dialog-title">确认处理标准</h2></div>
              <button type="button" className="icon-button" aria-label="关闭" onClick={() => setResult(undefined)}><X size={18} /></button>
            </div>
            <div className="command-result-group">
              <h3><CheckCircle size={18} weight="fill" /> 已理解</h3>
              {result.recognized.length ? <ul>{result.recognized.map((item) => <li key={item}>{item}</li>)}</ul> : <p>暂未识别出可应用的标准</p>}
            </div>
            {result.unrecognized.length > 0 && <div className="command-result-group warning"><h3><WarningCircle size={18} weight="fill" /> 需要您确认</h3><p>以下内容暂不会应用：</p><ul>{result.unrecognized.map((item) => <li key={item}>{item}</li>)}</ul></div>}
            <div className="dialog-actions"><button type="button" className="secondary-button" onClick={() => setResult(undefined)}>返回修改</button><button type="button" className="primary-button" disabled={!result.recognized.length} onClick={confirm}>确认并应用</button></div>
          </section>
        </div>
      )}
    </>
  )
}
