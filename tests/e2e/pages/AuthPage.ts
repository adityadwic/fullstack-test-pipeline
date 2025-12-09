import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Auth Page Object - handles login and registration modals
 */
export class AuthPage extends BasePage {
  // Login modal
  readonly loginModal: Locator;
  readonly loginEmail: Locator;
  readonly loginPassword: Locator;
  readonly loginSubmit: Locator;
  readonly loginError: Locator;
  readonly closeLoginButton: Locator;
  readonly showRegisterLink: Locator;

  // Register modal
  readonly registerModal: Locator;
  readonly registerName: Locator;
  readonly registerEmail: Locator;
  readonly registerPassword: Locator;
  readonly registerSubmit: Locator;
  readonly registerError: Locator;
  readonly closeRegisterButton: Locator;
  readonly showLoginLink: Locator;

  constructor(page: Page) {
    super(page);
    
    // Login modal
    this.loginModal = page.locator('[data-testid="login-modal"]');
    this.loginEmail = page.locator('[data-testid="login-email"]');
    this.loginPassword = page.locator('[data-testid="login-password"]');
    this.loginSubmit = page.locator('[data-testid="login-submit"]');
    this.loginError = page.locator('[data-testid="login-error"]');
    this.closeLoginButton = page.locator('[data-testid="close-login"]');
    this.showRegisterLink = page.locator('[data-testid="show-register"]');

    // Register modal
    this.registerModal = page.locator('[data-testid="register-modal"]');
    this.registerName = page.locator('[data-testid="register-name"]');
    this.registerEmail = page.locator('[data-testid="register-email"]');
    this.registerPassword = page.locator('[data-testid="register-password"]');
    this.registerSubmit = page.locator('[data-testid="register-submit"]');
    this.registerError = page.locator('[data-testid="register-error"]');
    this.closeRegisterButton = page.locator('[data-testid="close-register"]');
    this.showLoginLink = page.locator('[data-testid="show-login"]');
  }

  /**
   * Open login modal
   */
  async openLoginModal() {
    await this.loginButton.click();
    await this.loginModal.waitFor({ state: 'visible' });
  }

  /**
   * Close login modal
   */
  async closeLoginModal() {
    await this.closeLoginButton.click();
    await this.loginModal.waitFor({ state: 'hidden' });
  }

  /**
   * Switch to register modal
   */
  async switchToRegister() {
    await this.showRegisterLink.click();
    await this.registerModal.waitFor({ state: 'visible' });
  }

  /**
   * Switch to login modal from register
   */
  async switchToLogin() {
    await this.showLoginLink.click();
    await this.loginModal.waitFor({ state: 'visible' });
  }

  /**
   * Fill login form and submit
   */
  async login(email: string, password: string) {
    await this.loginEmail.fill(email);
    await this.loginPassword.fill(password);
    await this.loginSubmit.click();
    // Wait for either success (modal closes) or error (error message appears)
    await Promise.race([
      this.loginModal.waitFor({ state: 'hidden', timeout: 5000 }),
      this.loginError.waitFor({ state: 'visible', timeout: 5000 }),
    ]);
  }

  /**
   * Fill register form and submit
   */
  async register(name: string, email: string, password: string) {
    await this.registerName.fill(name);
    await this.registerEmail.fill(email);
    await this.registerPassword.fill(password);
    await this.registerSubmit.click();
    // Wait for either success (switches to login) or error
    await Promise.race([
      this.loginModal.waitFor({ state: 'visible', timeout: 5000 }),
      this.registerError.waitFor({ state: 'visible', timeout: 5000 }),
    ]);
  }

  /**
   * Check if login modal is visible
   */
  async isLoginModalVisible(): Promise<boolean> {
    return await this.loginModal.evaluate(el => el.classList.contains('active'));
  }

  /**
   * Check if register modal is visible
   */
  async isRegisterModalVisible(): Promise<boolean> {
    return await this.registerModal.evaluate(el => el.classList.contains('active'));
  }

  /**
   * Get login error message
   */
  async getLoginError(): Promise<string> {
    return await this.loginError.textContent() || '';
  }

  /**
   * Get register error message
   */
  async getRegisterError(): Promise<string> {
    return await this.registerError.textContent() || '';
  }

  /**
   * Check if user is logged in
   */
  async isLoggedIn(): Promise<boolean> {
    const buttonText = await this.loginButton.textContent();
    return buttonText === 'Logout';
  }

  /**
   * Logout
   */
  async logout() {
    if (await this.isLoggedIn()) {
      await this.loginButton.click();
      await this.page.waitForTimeout(500);
    }
  }
}
