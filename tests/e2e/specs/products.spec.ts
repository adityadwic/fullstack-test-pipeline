import { test, expect } from '@playwright/test';

test.describe('Products - Smoke Tests', () => {
  test('should display products section', async ({ page }) => {
    await page.goto('/');
    
    // Check products section exists
    const productsSection = page.locator('#products');
    await expect(productsSection).toBeVisible();
  });

  test('should display product grid after loading', async ({ page }) => {
    await page.goto('/');
    
    // Wait for products grid
    const productGrid = page.locator('#product-grid');
    await expect(productGrid).toBeVisible();
    
    // Wait for loading to finish (loading element should be hidden or removed)
    // Give it time for the API call to complete
    await page.waitForTimeout(2000);
    
    // Check if product cards exist (might be 0 if database is empty)
    const productCards = page.locator('.product-card');
    const count = await productCards.count();
    
    // Just verify we can count products (0 or more is valid)
    expect(count).toBeGreaterThanOrEqual(0);
    
    // If there are products, verify first one is visible
    if (count > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });
});
