import { test, expect, type Page } from '@playwright/test'

async function loginAsAdmin(page: Page) {
  const email    = process.env.TEST_ADMIN_EMAIL    ?? process.env.TEST_EMAIL
  const password = process.env.TEST_ADMIN_PASSWORD ?? process.env.TEST_PASSWORD
  if (!email || !password) test.skip()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Fjalëkalimi').fill(password!)
  await page.getByRole('button', { name: 'Hyr' }).click()
  await page.waitForURL(/\/(admin|zones)/, { timeout: 10000 })
}

test.describe('Admin dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.goto('/admin/dashboard')
  })

  test('shows occupancy cards', async ({ page }) => {
    await expect(page.getByText('Të zëna')).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('Të lira')).toBeVisible()
    await expect(page.getByText('Zënia %')).toBeVisible()
  })

  test('shows the export button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Eksporto CSV/i })).toBeVisible()
  })

  test('has working zone filter', async ({ page }) => {
    const select = page.getByRole('combobox').first()
    if (await select.isVisible()) {
      await select.click()
      await page.getByText('Z1').click()
      await expect(page).toHaveURL(/zone=Z1/)
    }
  })
})
