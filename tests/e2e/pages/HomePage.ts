import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Home Page Object - represents the landing page
 */
export class HomePage extends BasePage {
  // Hero section
  readonly heroTitle: Locator;
  readonly heroSubtitle: Locator;
  readonly shopNowButton: Locator;
  readonly learnMoreButton: Locator;
  
  // Categories section
  readonly categoryCards: Locator;
  readonly electronicsCategory: Locator;
  readonly clothingCategory: Locator;
  readonly booksCategory: Locator;
  readonly homeCategory: Locator;

  constructor(page: Page) {
    super(page);
    
    // Hero section
    this.heroTitle = page.locator('[data-testid="hero-title"]');
    this.heroSubtitle = page.locator('.hero-subtitle');
    this.shopNowButton = page.locator('[data-testid="shop-now-btn"]');
    this.learnMoreButton = page.locator('[data-testid="learn-more-btn"]');
    
    // Categories
    this.categoryCards = page.locator('.category-card');
    this.electronicsCategory = page.locator('[data-testid="category-electronics"]');
    this.clothingCategory = page.locator('[data-testid="category-clothing"]');
    this.booksCategory = page.locator('[data-testid="category-books"]');
    this.homeCategory = page.locator('[data-testid="category-home"]');
  }

  /**
   * Navigate to home page
   */
  async goto() {
    await this.navigate('/');
  }

  /**
   * Check if hero section is visible
   */
  async isHeroVisible(): Promise<boolean> {
    return await this.heroTitle.isVisible();
  }

  /**
   * Get hero title text
   */
  async getHeroTitle(): Promise<string> {
    return await this.heroTitle.textContent() || '';
  }

  /**
   * Click Shop Now button
   */
  async clickShopNow() {
    await this.shopNowButton.click();
    // Wait for scroll to products section
    await this.page.waitForFunction(() => {
      const productsSection = document.getElementById('products');
      return productsSection && productsSection.getBoundingClientRect().top < 100;
    });
  }

  /**
   * Select a category
   */
  async selectCategory(category: 'electronics' | 'clothing' | 'books' | 'home') {
    const categoryMap = {
      electronics: this.electronicsCategory,
      clothing: this.clothingCategory,
      books: this.booksCategory,
      home: this.homeCategory,
    };
    
    await categoryMap[category].click();
    await this.page.waitForTimeout(500); // Wait for products to filter
  }

  /**
   * Get number of visible categories
   */
  async getCategoryCount(): Promise<number> {
    return await this.categoryCards.count();
  }
}
