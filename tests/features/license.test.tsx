import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { LicenseScreen } from '../../src/features/license/LicenseScreen'

describe('license screen', () => {
  it('explains the non-destructive three-photo trial', () => {
    render(<LicenseScreen deviceCode="AD-ABCD-1234" onActivate={vi.fn()} />)
    expect(screen.getByText('AD-ABCD-1234')).toBeVisible()
    expect(screen.getByText(/可处理 3 张自己的照片/)).toBeVisible()
  })

  it('activates only after the supplied license is accepted', async () => {
    const onActivate = vi.fn().mockResolvedValue({ ok: true })
    const user = userEvent.setup()
    render(<LicenseScreen deviceCode="AD-ABCD-1234" onActivate={onActivate} />)
    await user.type(screen.getByRole('textbox', { name: '授权码' }), 'body.signature')
    await user.click(screen.getByRole('button', { name: '激活本机' }))
    expect(onActivate).toHaveBeenCalledWith('body.signature')
    expect(await screen.findByText('激活成功')).toBeVisible()
  })
})
