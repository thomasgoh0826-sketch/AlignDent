import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UrlImportDialog } from '../../src/features/import/UrlImportDialog'

describe('URL image import', () => {
  it('submits one direct HTTP image URL per line', async () => {
    const onDownload = vi.fn().mockResolvedValue(['C:\\Downloads\\a.jpg'])
    const user = userEvent.setup()
    render(<UrlImportDialog onClose={vi.fn()} onDownload={onDownload} />)
    await user.type(screen.getByRole('textbox', { name: '图片链接' }), 'https://example.com/a.jpg\nhttps://example.com/b.png')
    await user.click(screen.getByRole('button', { name: '下载并导入' }))
    expect(onDownload).toHaveBeenCalledWith(['https://example.com/a.jpg', 'https://example.com/b.png'])
  })
})
