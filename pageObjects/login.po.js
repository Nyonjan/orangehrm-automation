const { expect } = require('@playwright/test');

exports.LoginPage = class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.usernameInput = 'input[name="username"]';
    this.passwordInput = 'input[name="password"]';
    this.loginButton = 'button[type="submit"]';
    this.userDropdown = '.oxd-userdropdown-name';
    this.errorMessage = '[role="alert"]';
    this.usernameInputGroup = '.oxd-input-group:has(input[name="username"])';
    this.passwordInputGroup = '.oxd-input-group:has(input[name="password"])';
    this.fieldErrorMessage = '.oxd-input-field-error-message';
  }

  // Navigate
  async navigate() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // Verify we are on the login page
    await expect(this.page).toHaveURL(/.*login/, { timeout: 15000 });
    await expect(this.page.locator(this.usernameInput)).toBeVisible({ timeout: 15000 });
  }

  // Actions
  async login(username, password) {
    await this.page.locator(this.usernameInput).waitFor({ state: 'visible', timeout: 15000 });
    await this.page.locator(this.usernameInput).fill(username || '');
    await this.page.locator(this.passwordInput).fill(password || '');
    await this.page.locator(this.loginButton).click();
  }

  async verifyValidLogin() {
    await expect(this.page).toHaveURL(/.*dashboard/, { timeout: 15000 });
    const userDropdown = this.page.locator(this.userDropdown);
    await expect(userDropdown).toBeVisible({ timeout: 15000 });
    // Additional validation: Header visibility
    await expect(this.page.locator('.oxd-topbar-header-breadcrumb')).toBeVisible();
  }

  async verifyInvalidLogin() {
    await expect(this.page).not.toHaveURL(/.*dashboard/);
    await expect(this.page.locator(this.errorMessage)).toBeVisible({ timeout: 5000 });
    await expect(this.page.locator(this.errorMessage)).toContainText('Invalid credentials');
  }

  async verifyUsernameRequiredError() {
    const errorLocator = this.page.locator(`${this.usernameInputGroup} ${this.fieldErrorMessage}`);
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
    await expect(errorLocator).toHaveText('Required');
    await expect(this.page).not.toHaveURL(/.*dashboard/);
  }

  async verifyPasswordRequiredError() {
    const errorLocator = this.page.locator(`${this.passwordInputGroup} ${this.fieldErrorMessage}`);
    await expect(errorLocator).toBeVisible({ timeout: 5000 });
    await expect(errorLocator).toHaveText('Required');
    await expect(this.page).not.toHaveURL(/.*dashboard/);
  }

  async verifyBothRequiredErrors() {
    await this.verifyUsernameRequiredError();
    await this.verifyPasswordRequiredError();
  }

  async logout() {
    await this.page.locator(this.userDropdown).click();
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }

  async verifyLogout() {
    await expect(this.page).toHaveURL(/.*login/, { timeout: 10000 });
    await expect(this.page.locator(this.usernameInput)).toBeVisible({ timeout: 10000 });
  }

};