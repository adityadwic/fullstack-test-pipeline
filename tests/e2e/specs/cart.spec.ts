import { test, expect } from '@playwright/test';

test.describe('Cart - Smoke Tests', () => {
  test('should open cart sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Click cart button to open sidebar
    await page.locator('[data-testid="cart-btn"]').click();
    
    // Verify sidebar is visible
    const sidebar = page.locator('[data-testid="cart-sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  test('should show empty cart state', async ({ page }) => {
    await page.goto('/');
    
    // Open cart
    await page.locator('[data-testid="cart-btn"]').click();
    
    // Check empty state exists (checkout button should be disabled)
    const checkoutBtn = page.locator('[data-testid="checkout-btn"]');
    await expect(checkoutBtn).toBeDisabled();
  });

  test('should close cart sidebar', async ({ page }) => {
    await page.goto('/');
    
    // Open cart
    await page.locator('[data-testid="cart-btn"]').click();
    
    // Close cart
    await page.locator('[data-testid="close-cart"]').click();
    
    // Verify sidebar is hidden (has no active class)
    const sidebar = page.locator('[data-testid="cart-sidebar"]');
    await expect(sidebar).not.toHaveClass(/active/);
  });
});
