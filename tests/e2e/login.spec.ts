import { test, expect } from '@playwright/test'

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('shows the login form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Identifikimi' })).toBeVisible()
    await expect(page.getByLabel('Email')).toBeVisible()
    await expect(page.getByLabel('Fjalëkalimi')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hyr' })).toBeVisible()
  })

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid@test.com')
    await page.getByLabel('Fjalëkalimi').fill('wrongpassword')
    await page.getByRole('button', { name: 'Hyr' }).click()
    await expect(page.getByRole('alert')).toBeVisible({ timeout: 8000 })
  })

  test('redirects authenticated users away from login', async ({ page }) => {
    // This test assumes a valid test user exists in the test Supabase instance
    // Set TEST_EMAIL and TEST_PASSWORD env vars for CI
    const email    = process.env.TEST_EMAIL
    const password = process.env.TEST_PASSWORD
    if (!email || !password) test.skip()

    await page.getByLabel('Email').fill(email!)
    await page.getByLabel('Fjalëkalimi').fill(password!)
    await page.getByRole('button', { name: 'Hyr' }).click()
    await expect(page).toHaveURL(/\/zones/, { timeout: 10000 })
  })
})
