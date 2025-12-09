import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Products Page Object - represents the products section
 */
export class ProductsPage extends BasePage {
  // Filters
  readonly categoryFilter: Locator;
  readonly sortFilter: Locator;
  
  // Products grid
  readonly productGrid: Locator;
  readonly productCards: Locator;
  readonly productsLoading: Locator;

  constructor(page: Page) {
    super(page);
    
    this.categoryFilter = page.locator('[data-testid="category-filter"]');
    this.sortFilter = page.locator('[data-testid="sort-filter"]');
    this.productGrid = page.locator('#product-grid');
    this.productCards = page.locator('.product-card');
    this.productsLoading = page.locator('#products-loading');
  }

  /**
   * Navigate to products section
   */
  async goto() {
    await this.navigate('/#products');
  }

  /**
   * Wait for products to load
   */
  async waitForProductsLoaded() {
    await this.productsLoading.waitFor({ state: 'hidden' });
    await this.productCards.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get number of visible products
   */
  async getProductCount(): Promise<number> {
    await this.waitForProductsLoaded();
    return await this.productCards.count();
  }

  /**
   * Filter by category
   */
  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.page.waitForTimeout(500);
  }

  /**
   * Sort products
   */
  async sortBy(option: 'default' | 'price-low' | 'price-high' | 'name') {
    await this.sortFilter.selectOption(option);
    await this.page.waitForTimeout(300);
  }

  /**
   * Get product card by index
   */
  getProductCard(index: number): Locator {
    return this.productCards.nth(index);
  }

  /**
   * Get product by ID
   */
  getProductById(id: string) {
    return {
      card: this.page.locator(`[data-testid="product-${id}"]`),
      name: this.page.locator(`[data-testid="product-name-${id}"]`),
      price: this.page.locator(`[data-testid="product-price-${id}"]`),
      addToCartButton: this.page.locator(`[data-testid="add-to-cart-${id}"]`),
    };
  }

  /**
   * Add product to cart by index
   */
  async addToCartByIndex(index: number) {
    const card = this.productCards.nth(index);
    const addButton = card.locator('.add-to-cart-btn');
    await addButton.click();
    await this.waitForToast();
  }

  /**
   * Get all product names
   */
  async getAllProductNames(): Promise<string[]> {
    await this.waitForProductsLoaded();
    const names: string[] = [];
    const count = await this.productCards.count();
    
    for (let i = 0; i < count; i++) {
      const name = await this.productCards.nth(i).locator('.product-name').textContent();
      if (name) names.push(name);
    }
    
    return names;
  }

  /**
   * Get all product prices
   */
  async getAllProductPrices(): Promise<number[]> {
    await this.waitForProductsLoaded();
    const prices: number[] = [];
    const count = await this.productCards.count();
    
    for (let i = 0; i < count; i++) {
      const priceText = await this.productCards.nth(i).locator('.product-price').textContent();
      if (priceText) {
        const price = parseFloat(priceText.replace('$', ''));
        prices.push(price);
      }
    }
    
    return prices;
  }
}
