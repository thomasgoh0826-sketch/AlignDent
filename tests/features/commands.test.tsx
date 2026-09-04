import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommandComposer } from '../../src/features/commands/CommandComposer'

describe('command confirmation', () => {
  it('shows understood and unknown clauses before applying', async () => {
    const onApply = vi.fn()
    const user = userEvent.setup()
    render(<CommandComposer onApply={onApply} />)

    await user.type(screen.getByRole('textbox', { name: '处理标准' }), '摆正头位，裁成 4:5，皮肤更白{Enter}')

    expect(screen.getByRole('dialog', { name: '确认处理标准' })).toBeVisible()
    expect(screen.getByText('自动摆正头位')).toBeVisible()
    expect(screen.getByText('输出比例 4:5')).toBeVisible()
    expect(screen.getByText('皮肤更白')).toBeVisible()
    expect(onApply).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: '确认并应用' }))
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ ratio: '4:5', straighten: true }))
  })

  it('does not submit an empty instruction', async () => {
    const user = userEvent.setup()
    render(<CommandComposer onApply={vi.fn()} />)
    await user.type(screen.getByRole('textbox', { name: '处理标准' }), '{Enter}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
