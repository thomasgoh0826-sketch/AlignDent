import { _electron as electron, expect, test } from '@playwright/test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

test('opens the sample and exposes the complete correction workflow', async () => {
  const userData = await mkdtemp(path.join(tmpdir(), 'aligndent-e2e-'))
  const app = await electron.launch({ args: ['.', `--user-data-dir=${userData}`] })
  try {
    const page = await app.firstWindow()
    await expect(page.getByRole('heading', { name: '照片标准化' })).toBeVisible()
    await page.getByRole('button', { name: '查看示例' }).click()
    await expect(page.getByRole('img', { name: '虚构演示人像' })).toBeVisible()
    await expect(page.getByTestId('standardized-image')).toBeVisible()
    await expect(page.getByText(/双瞳已水平/)).toBeVisible()
    await page.getByRole('button', { name: '重新识别' }).click()
    await expect(page.getByText(/已自动对齐|需要检查/)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByTestId('standardized-image')).toBeVisible()
    await page.getByRole('button', { name: '调整定位点' }).click()
    await expect(page.getByRole('button', { name: '左瞳孔定位点' })).toBeVisible()
    await page.getByRole('button', { name: '鼻尖定位点' }).press('ArrowRight')
    await expect(page.getByRole('button', { name: '确认此张' })).toBeEnabled()
    await page.getByRole('button', { name: '确认此张' }).click()
    await expect(page.getByText('已人工确认')).toBeVisible()
    await expect(page.getByTestId('standardized-image')).toBeVisible()
  } finally {
    await app.close()
    await rm(userData, { recursive: true, force: true })
  }
})
