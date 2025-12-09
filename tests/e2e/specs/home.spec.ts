import { test, expect } from '@playwright/test';

test.describe('Home Page - Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    
    // Check page loads and has correct title
    await expect(page).toHaveTitle(/TestStore|Test E-Commerce/);
  });

  test('should display header elements', async ({ page }) => {
    await page.goto('/');
    
    // Check header exists
    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('should display hero section', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();
  });

  test('should display hero title', async ({ page }) => {
    await page.goto('/');
    
    // Check hero title
    const heroTitle = page.locator('[data-testid="hero-title"]');
    await expect(heroTitle).toContainText('TestStore');
  });

  test('should display products section', async ({ page }) => {
    await page.goto('/');
    
    // Wait for products to load
    const productsSection = page.locator('#products');
    await expect(productsSection).toBeVisible();
  });

  test('should have working cart button', async ({ page }) => {
    await page.goto('/');
    
    // Click cart button (note: testid is cart-btn not cart-button)
    const cartButton = page.locator('[data-testid="cart-btn"]');
    await expect(cartButton).toBeVisible();
    await cartButton.click();
    
    // Cart sidebar should be visible
    const cartSidebar = page.locator('[data-testid="cart-sidebar"]');
    await expect(cartSidebar).toBeVisible();
  });
});
