const { test } = require('@playwright/test');
const { LoginPage } = require('../pageObjects/login.po');
const testData = require('../fixtures/loginFixture.json');

test.describe('OrangeHRM Login Module', () => {

  test('LOG_001 - Valid Login Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Enter valid username and password, then click Login
    await login.login(testData.validUser.username, testData.validUser.password);

    // Verify user is logged in and Dashboard page is displayed successfully
    await login.verifyValidLogin();
  });

  test('LOG_002 - Invalid Username Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Enter invalid username and valid password, then click Login
    await login.login(testData.invalidUsernameUser.username, testData.invalidUsernameUser.password);

    // Verify user remains on login page and invalid credentials message is displayed
    await login.verifyInvalidLogin();
  });

  test('LOG_003 - Invalid Password Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Enter valid username and invalid password, then click Login
    await login.login(testData.invalidPasswordUser.username, testData.invalidPasswordUser.password);

    // Verify user remains on login page and invalid credentials message is displayed
    await login.verifyInvalidLogin();
  });

  test('LOG_004 - Empty Username Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Leave username field empty, enter valid password, click Login
    await login.login('', testData.validUser.password);

    // Verify user remains on login page and Required validation message is displayed for username
    await login.verifyUsernameRequiredError();
  });

  test('LOG_005 - Empty Password Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Enter valid username, leave password field empty, click Login
    await login.login(testData.validUser.username, '');

    // Verify user remains on login page and Required validation message is displayed for password
    await login.verifyPasswordRequiredError();
  });

  test('LOG_006 - Empty Credentials Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Leave both username and password fields empty, click Login
    await login.login('', '');

    // Verify user remains on login page and Required validation messages are displayed for both fields
    await login.verifyBothRequiredErrors();
  });

  test('LOG_007 - Logout Test', async ({ page }) => {
    const login = new LoginPage(page);

    // Navigate to login URL
    await login.navigate();

    // Login with valid credentials
    await login.login(testData.validUser.username, testData.validUser.password);
    await login.verifyValidLogin();

    // Click profile dropdown and select Logout
    await login.logout();

    // Verify user is redirected back to the login page
    await login.verifyLogout();
  });

});