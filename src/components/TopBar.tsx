import { GearSix, Moon, Sun } from '@phosphor-icons/react'
import { useState } from 'react'
import type { CommandPatch } from '../domain/types'
import { CommandComposer } from '../features/commands/CommandComposer'
import { ApiSettingsDialog } from '../features/settings/ApiSettingsDialog'

export function TopBar({ theme, onToggleTheme, onApplyCommand, statusMessage }: {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onApplyCommand: (patch: CommandPatch) => void
  statusMessage?: string
}) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  return (
    <header className="topbar">
      <div className="task-heading"><span className="task-kicker">当前任务</span><h1>照片标准化</h1></div>
      <CommandComposer onApply={onApplyCommand} />
      <div className="topbar-actions">
        {statusMessage && <span className="apply-status" role="status">{statusMessage}</span>}
        <button className="icon-button" type="button" aria-label="API 设置" onClick={() => setSettingsOpen(true)}><GearSix size={20} /></button>
        <button className="icon-button" type="button" aria-label={theme === 'light' ? '切换到深色主题' : '切换到浅色主题'} onClick={onToggleTheme}>{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</button>
      </div>
      {settingsOpen && <ApiSettingsDialog onClose={() => setSettingsOpen(false)} />}
    </header>
  )
}
