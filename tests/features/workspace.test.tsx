import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../../src/App'
import { useWorkspaceStore } from '../../src/store/useWorkspaceStore'

describe('A-layout professional workspace', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset()
    Object.defineProperty(window, 'alignDent', {
      configurable: true,
      value: {
        platform: 'win32',
        version: '0.1.0',
        files: {
          chooseImages: vi.fn().mockResolvedValue([]),
          chooseFolder: vi.fn().mockResolvedValue([]),
        },
      },
    })
  })

  it('shows one clear import action in the empty state', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '照片标准化' })).toBeVisible()
    expect(screen.getByRole('button', { name: '导入照片' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '查看示例' })).toBeEnabled()
    expect(screen.getByRole('navigation', { name: '主要导航' })).toBeVisible()
  })

  it('opens a real sample in the three-pane review workspace', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '查看示例' }))

    expect(screen.getByRole('img', { name: '虚构演示人像' })).toBeVisible()
    expect(screen.getByText('已自动对齐')).toBeVisible()
    expect(screen.getByRole('button', { name: '导出 1 张' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '九宫格' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('面中线与图片中线重合')).toBeVisible()
    expect(screen.getByText('Built by Zyls')).toBeVisible()
  })

  it('renders the selected standard view with the real affine correction', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '查看示例' }))

    expect(screen.getByTestId('standardized-image')).toHaveAttribute('viewBox', '0 0 1600 2000')
    expect(screen.getByTestId('standardized-image-source').getAttribute('transform')).toMatch(/^matrix\(/)
    expect(screen.getByText(/双瞳已水平/)).toBeVisible()

    await user.click(screen.getByRole('button', { name: '调整定位点' }))
    expect(screen.getByRole('button', { name: '原图' })).toHaveClass('is-selected')
    expect(screen.getByTestId('photo-canvas-surface')).toBeVisible()
    expect(screen.queryByTestId('standardized-image')).not.toBeInTheDocument()
  })

  it('recalculates the standard image when the output template changes', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '查看示例' }))

    await user.selectOptions(screen.getByRole('combobox', { name: '图片比例' }), '1:1')

    expect(screen.getByTestId('standardized-image')).toHaveAttribute('viewBox', '0 0 1600 1600')
  })

  it('imports multiple local paths and changes the primary action to processing', async () => {
    const chooseImages = vi.fn().mockResolvedValue([
      'C:\\Patients\\front.jpg',
      'C:\\Patients\\smile.png',
    ])
    Object.defineProperty(window, 'alignDent', {
      configurable: true,
      value: {
        platform: 'win32',
        version: '0.1.0',
        files: { chooseImages, chooseFolder: vi.fn().mockResolvedValue([]) },
      },
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '导入照片' }))

    expect(chooseImages).toHaveBeenCalledOnce()
    expect(screen.getAllByText('front.jpg').length).toBeGreaterThan(0)
    expect(screen.getByText('smile.png')).toBeVisible()
    expect(screen.getByText('2 张照片')).toBeVisible()
    expect(screen.getByRole('button', { name: '开始处理' })).toBeEnabled()
  })

  it('keeps the public community build free of the three-photo activation limit', async () => {
    const paths = [
      'C:\\Patients\\one.jpg',
      'C:\\Patients\\two.jpg',
      'C:\\Patients\\three.jpg',
      'C:\\Patients\\four.jpg',
    ]
    Object.defineProperty(window, 'alignDent', {
      configurable: true,
      value: {
        platform: 'win32',
        version: '0.1.0',
        files: { chooseImages: vi.fn().mockResolvedValue(paths), chooseFolder: vi.fn().mockResolvedValue([]) },
      },
    })
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: '导入照片' }))

    expect(screen.getByText('4 张照片')).toBeVisible()
    expect(screen.queryByRole('button', { name: '授权与设备码' })).not.toBeInTheDocument()
  })

  it('allows the grid overlay to be turned off without hiding other controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: '查看示例' }))

    const gridButton = screen.getByRole('button', { name: '九宫格' })
    await user.click(gridButton)

    expect(gridButton).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '标准图' })).toBeVisible()
  })
})
