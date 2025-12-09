import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Checkout Page Object - handles checkout modal and order confirmation
 */
export class CheckoutPage extends BasePage {
  // Checkout modal
  readonly checkoutModal: Locator;
  readonly shippingAddress: Locator;
  readonly shippingCity: Locator;
  readonly shippingZip: Locator;
  readonly orderSummary: Locator;
  readonly placeOrderButton: Locator;
  readonly checkoutError: Locator;
  readonly closeCheckoutButton: Locator;

  // Confirmation modal
  readonly confirmationModal: Locator;
  readonly orderId: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    
    // Checkout modal
    this.checkoutModal = page.locator('[data-testid="checkout-modal"]');
    this.shippingAddress = page.locator('[data-testid="shipping-address"]');
    this.shippingCity = page.locator('[data-testid="shipping-city"]');
    this.shippingZip = page.locator('[data-testid="shipping-zip"]');
    this.orderSummary = page.locator('#order-summary');
    this.placeOrderButton = page.locator('[data-testid="place-order-btn"]');
    this.checkoutError = page.locator('[data-testid="checkout-error"]');
    this.closeCheckoutButton = page.locator('[data-testid="close-checkout"]');

    // Confirmation modal
    this.confirmationModal = page.locator('[data-testid="confirmation-modal"]');
    this.orderId = page.locator('[data-testid="order-id"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping"]');
  }

  /**
   * Check if checkout modal is visible
   */
  async isCheckoutVisible(): Promise<boolean> {
    return await this.checkoutModal.evaluate(el => el.classList.contains('active'));
  }

  /**
   * Close checkout modal
   */
  async closeCheckout() {
    await this.closeCheckoutButton.click();
    await this.checkoutModal.waitFor({ state: 'hidden' });
  }

  /**
   * Fill shipping information
   */
  async fillShippingInfo(address: string, city: string, zip: string) {
    await this.shippingAddress.fill(address);
    await this.shippingCity.fill(city);
    await this.shippingZip.fill(zip);
  }

  /**
   * Place order
   */
  async placeOrder() {
    await this.placeOrderButton.click();
    // Wait for either confirmation or error
    await Promise.race([
      this.confirmationModal.waitFor({ state: 'visible', timeout: 10000 }),
      this.checkoutError.waitFor({ state: 'visible', timeout: 10000 }),
    ]);
  }

  /**
   * Complete full checkout flow
   */
  async completeCheckout(address: string, city: string, zip: string) {
    await this.fillShippingInfo(address, city, zip);
    await this.placeOrder();
  }

  /**
   * Get checkout error message
   */
  async getCheckoutError(): Promise<string> {
    return await this.checkoutError.textContent() || '';
  }

  /**
   * Check if confirmation modal is visible
   */
  async isConfirmationVisible(): Promise<boolean> {
    return await this.confirmationModal.evaluate(el => el.classList.contains('active'));
  }

  /**
   * Get order ID from confirmation
   */
  async getOrderId(): Promise<string> {
    await this.orderId.waitFor({ state: 'visible' });
    return await this.orderId.textContent() || '';
  }

  /**
   * Click continue shopping
   */
  async continueShopping() {
    await this.continueShoppingButton.click();
    await this.confirmationModal.waitFor({ state: 'hidden' });
  }

  /**
   * Get order summary items count
   */
  async getOrderSummaryItemsCount(): Promise<number> {
    const items = this.orderSummary.locator('.order-summary-item');
    return await items.count();
  }

  /**
   * Get total from order summary
   */
  async getOrderTotal(): Promise<string> {
    const total = this.orderSummary.locator('.order-summary-total');
    const text = await total.textContent();
    return text || '';
  }
}
