import { expect, test } from '@playwright/test'

test('loads the Pages build and runs the demo audio path', async ({ page }) => {
  await page.goto('/world-demucs/')

  await expect(page.getByRole('heading', { name: 'World-Demucs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Star on GitHub' })).toHaveAttribute(
    'href',
    'https://github.com/baditaflorin/world-demucs',
  )
  await expect(page.getByText('Version')).toBeVisible()

  await page.getByRole('button', { name: 'Demo' }).click()
  await expect(page.getByText('Demo live')).toBeVisible()
  await page.getByRole('button', { name: 'Conversation Bed' }).click()
  await expect(page.locator('[data-preset="conversation-bed"]')).toHaveClass(/is-active/)
  await page.getByRole('button', { name: 'Stop' }).click()
  await expect(page.getByText('Idle')).toBeVisible()
})
