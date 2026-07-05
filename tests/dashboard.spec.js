const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pageObjects/login.po');
const { DashboardPage } = require('../pageObjects/dashboard.po.js');
const loginData = require('../fixtures/loginFixture.json');

test.describe('OrangeHRM Dashboard Module', () => {

    test('DASH_002 - Menu Navigation Test', async ({ page }) => {
        const login = new LoginPage(page);
        const dashboard = new DashboardPage(page);

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to PIM module and verify
        await dashboard.navigateToModule('PIM');

        // 3. Navigate to Admin module and verify
        await dashboard.navigateToModule('Admin');

        // 4. Navigate to Leave module and verify
        await dashboard.navigateToModule('Leave');
    });

});
