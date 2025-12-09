import { Page, Locator } from '@playwright/test';

/**
 * Base Page Object - provides common functionality for all pages
 */
export abstract class BasePage {
  readonly page: Page;
  
  // Common locators
  readonly header: Locator;
  readonly logo: Locator;
  readonly cartButton: Locator;
  readonly cartCount: Locator;
  readonly loginButton: Locator;
  readonly toastContainer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('#header');
    this.logo = page.locator('#logo');
    this.cartButton = page.locator('[data-testid="cart-btn"]');
    this.cartCount = page.locator('#cart-count');
    this.loginButton = page.locator('[data-testid="login-btn"]');
    this.toastContainer = page.locator('#toast-container');
  }

  /**
   * Navigate to a specific path
   */
  async navigate(path: string = '/') {
    await this.page.goto(path);
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get current cart count
   */
  async getCartCount(): Promise<number> {
    const text = await this.cartCount.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Click cart button to open cart sidebar
   */
  async openCart() {
    await this.cartButton.click();
    await this.page.waitForSelector('[data-testid="cart-sidebar"].active');
  }

  /**
   * Click login button
   */
  async clickLogin() {
    await this.loginButton.click();
    await this.page.waitForSelector('[data-testid="login-modal"].active');
  }

  /**
   * Wait for and get toast message
   */
  async waitForToast(): Promise<string> {
    const toast = this.toastContainer.locator('.toast').first();
    await toast.waitFor({ state: 'visible' });
    return await toast.textContent() || '';
  }

  /**
   * Take a screenshot with a custom name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `reports/e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }
}
