import { test, expect, type Page } from '@playwright/test'

async function loginAsEmployee(page: Page) {
  const email    = process.env.TEST_EMPLOYEE_EMAIL    ?? process.env.TEST_EMAIL
  const password = process.env.TEST_EMPLOYEE_PASSWORD ?? process.env.TEST_PASSWORD
  if (!email || !password) test.skip()

  await page.goto('/login')
  await page.getByLabel('Email').fill(email!)
  await page.getByLabel('Fjalëkalimi').fill(password!)
  await page.getByRole('button', { name: 'Hyr' }).click()
  await page.waitForURL(/\/zones/, { timeout: 10000 })
}

test.describe('Employee zone list', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page)
  })

  test('shows all 4 zones', async ({ page }) => {
    await expect(page.getByText('Zona 1')).toBeVisible()
    await expect(page.getByText('Zona 2')).toBeVisible()
    await expect(page.getByText('Zona 3')).toBeVisible()
    await expect(page.getByText('Zona 4')).toBeVisible()
  })

  test('navigates to zone map on click', async ({ page }) => {
    await page.getByText('Zona 1').first().click()
    await expect(page).toHaveURL(/\/zones\/Z1/, { timeout: 5000 })
  })
})

test.describe('Employee cannot access admin routes', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page)
  })

  test('redirects /admin/dashboard to /zones', async ({ page }) => {
    await page.goto('/admin/dashboard')
    await expect(page).toHaveURL(/\/zones/, { timeout: 5000 })
  })
})

test.describe('Zone map page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsEmployee(page)
    await page.goto('/zones/Z1')
  })

  test('renders the Leaflet map container', async ({ page }) => {
    await expect(page.getByTestId('leaflet-map')).toBeVisible({ timeout: 10000 })
  })

  test('shows the map legend', async ({ page }) => {
    await expect(page.getByText('I lirë')).toBeVisible()
    await expect(page.getByText('I zënë')).toBeVisible()
  })

  test('does not show admin statistics', async ({ page }) => {
    await expect(page.getByText('Dashboard')).not.toBeVisible()
    await expect(page.getByText('Raporte')).not.toBeVisible()
  })
})
