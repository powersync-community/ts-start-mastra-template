import { test, expect } from '@playwright/test'

test('chat app loads with correct UI', async ({ page }) => {
  await page.goto('/')
  // Wait for PowerSync to initialize (moves from "Initializing..." to chat UI)
  await expect(page.locator('h1')).toHaveText('Chat', { timeout: 15_000 })
  await expect(page.getByPlaceholder('Type a message...')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible()
  await page.screenshot({ path: 'tests/screenshots/01-initial-load.png', fullPage: true })
})

test('user can send a message and receive AI response', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Chat', { timeout: 15_000 })

  // Type and send a message
  const input = page.getByPlaceholder('Type a message...')
  await input.fill('Hello! What is your name?')
  await page.screenshot({ path: 'tests/screenshots/02-message-typed.png', fullPage: true })

  await page.getByRole('button', { name: 'Send' }).click()

  // User message should appear
  await expect(page.getByText('Hello! What is your name?')).toBeVisible({ timeout: 5_000 })
  await page.screenshot({ path: 'tests/screenshots/03-user-message-sent.png', fullPage: true })

  // Wait for AI response (marked with "AI" label)
  await expect(page.locator('text=AI').first()).toBeVisible({ timeout: 45_000 })
  await page.screenshot({ path: 'tests/screenshots/04-ai-response.png', fullPage: true })
})
