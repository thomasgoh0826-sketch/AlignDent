import {
  ClockCounterClockwise,
  GearSix,
  ImageSquare,
  Layout,
  Key,
  Plus,
} from '@phosphor-icons/react'
import { Brand } from './Brand'

const navigation = [
  { label: '当前任务', icon: ImageSquare, active: true },
  { label: '最近处理', icon: ClockCounterClockwise },
  { label: '标准模板', icon: Layout },
  { label: '设置', icon: GearSix },
]

export function Sidebar({ onNewTask, onLicense, showLicense = true }: { onNewTask: () => void; onLicense: () => void; showLicense?: boolean }) {
  return (
    <aside className="sidebar">
      <Brand />
      <button className="new-task-button" type="button" onClick={onNewTask}>
        <Plus size={18} weight="bold" aria-hidden="true" />
        新建任务
      </button>
      <nav className="sidebar-nav" aria-label="主要导航">
        {navigation.map(({ label, icon: Icon, active }) => (
          <button
            className={active ? 'nav-item is-active' : 'nav-item'}
            type="button"
            key={label}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
      <div className="privacy-note">
        <span className="privacy-icon" aria-hidden="true">本地</span>
        <div>
          <strong>照片留在本机</strong>
          <span>默认不上传网络</span>
        </div>
      </div>
      <p className="project-credit">Built by Zyls</p>
      {showLicense && <button className="license-link" type="button" onClick={onLicense}><Key size={16} />授权与设备码</button>}
    </aside>
  )
}
