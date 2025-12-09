import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Cart Page Object - represents the cart sidebar
 */
export class CartPage extends BasePage {
  // Cart sidebar elements
  readonly cartSidebar: Locator;
  readonly cartOverlay: Locator;
  readonly closeCartButton: Locator;
  readonly cartItems: Locator;
  readonly cartEmpty: Locator;
  readonly totalAmount: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    
    this.cartSidebar = page.locator('[data-testid="cart-sidebar"]');
    this.cartOverlay = page.locator('[data-testid="cart-overlay"]');
    this.closeCartButton = page.locator('[data-testid="close-cart"]');
    this.cartItems = page.locator('.cart-item');
    this.cartEmpty = page.locator('#cart-empty');
    this.totalAmount = page.locator('#total-amount');
    this.checkoutButton = page.locator('[data-testid="checkout-btn"]');
  }

  /**
   * Open cart sidebar
   */
  async open() {
    await this.cartButton.click();
    await this.cartSidebar.waitFor({ state: 'visible' });
  }

  /**
   * Close cart sidebar
   */
  async close() {
    await this.closeCartButton.click();
    await this.cartSidebar.waitFor({ state: 'hidden' });
  }

  /**
   * Close cart by clicking overlay
   */
  async closeByOverlay() {
    await this.cartOverlay.click({ position: { x: 10, y: 100 } });
    await this.cartSidebar.waitFor({ state: 'hidden' });
  }

  /**
   * Check if cart is open
   */
  async isOpen(): Promise<boolean> {
    return await this.cartSidebar.evaluate(el => el.classList.contains('active'));
  }

  /**
   * Check if cart is empty
   */
  async isEmpty(): Promise<boolean> {
    const count = await this.cartItems.count();
    return count === 0;
  }

  /**
   * Get number of items in cart
   */
  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  /**
   * Get total amount
   */
  async getTotalAmount(): Promise<number> {
    const text = await this.totalAmount.textContent();
    return parseFloat(text?.replace('$', '') || '0');
  }

  /**
   * Get cart item by product ID
   */
  getCartItem(productId: string) {
    const item = this.page.locator(`[data-testid="cart-item-${productId}"]`);
    return {
      container: item,
      quantity: this.page.locator(`[data-testid="quantity-${productId}"]`),
      increaseButton: this.page.locator(`[data-testid="increase-${productId}"]`),
      decreaseButton: this.page.locator(`[data-testid="decrease-${productId}"]`),
      removeButton: this.page.locator(`[data-testid="remove-${productId}"]`),
    };
  }

  /**
   * Increase quantity for a product
   */
  async increaseQuantity(productId: string) {
    const { increaseButton } = this.getCartItem(productId);
    await increaseButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Decrease quantity for a product
   */
  async decreaseQuantity(productId: string) {
    const { decreaseButton } = this.getCartItem(productId);
    await decreaseButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Remove item from cart
   */
  async removeItem(productId: string) {
    const { removeButton } = this.getCartItem(productId);
    await removeButton.click();
    await this.page.waitForTimeout(200);
  }

  /**
   * Get quantity for a product
   */
  async getQuantity(productId: string): Promise<number> {
    const { quantity } = this.getCartItem(productId);
    const text = await quantity.textContent();
    return parseInt(text || '0', 10);
  }

  /**
   * Click checkout button
   */
  async proceedToCheckout() {
    await this.checkoutButton.click();
    await this.page.waitForSelector('[data-testid="checkout-modal"].active');
  }

  /**
   * Check if checkout button is enabled
   */
  async isCheckoutEnabled(): Promise<boolean> {
    return await this.checkoutButton.isEnabled();
  }
}
