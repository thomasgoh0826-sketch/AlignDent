import { render, screen } from '@testing-library/react'
import { App } from '../../src/App'

describe('AlignDent application shell', () => {
  it('offers the core photo standardization action', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: '照片标准化' })).toBeVisible()
    expect(screen.getByRole('button', { name: '导入照片' })).toBeEnabled()
  })
})
