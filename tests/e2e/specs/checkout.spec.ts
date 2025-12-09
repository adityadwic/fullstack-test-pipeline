import { test, expect } from '@playwright/test';

test.describe('Auth - Smoke Tests', () => {
  test('should open login modal from header', async ({ page }) => {
    await page.goto('/');
    
    // Click login button
    await page.locator('[data-testid="login-btn"]').click();
    
    // Login modal should be visible
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).toBeVisible();
  });

  test('should close login modal', async ({ page }) => {
    await page.goto('/');
    
    // Open login modal
    await page.locator('[data-testid="login-btn"]').click();
    
    // Close
    await page.locator('[data-testid="close-login"]').click();
    
    // Modal should be hidden
    const loginModal = page.locator('[data-testid="login-modal"]');
    await expect(loginModal).not.toBeVisible();
  });

  test('should switch to register modal', async ({ page }) => {
    await page.goto('/');
    
    // Open login modal
    await page.locator('[data-testid="login-btn"]').click();
    
    // Click register link
    await page.locator('[data-testid="show-register"]').click();
    
    // Register modal should be visible
    const registerModal = page.locator('[data-testid="register-modal"]');
    await expect(registerModal).toBeVisible();
  });
});
