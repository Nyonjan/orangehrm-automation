const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pageObjects/login.po');
const { AdminPage } = require('../pageObjects/admin.po');
const loginData = require('../fixtures/loginFixture.json');
const adminData = require('../fixtures/adminFixture.json');

test.describe('OrangeHRM Admin Module', () => {

    test('ADM_001 - Add System User Test', async ({ page }) => {
        const login = new LoginPage(page);
        const admin = new AdminPage(page);

        // Generate unique username to avoid conflicts
        const uniqueUsername = `user.${Date.now().toString().slice(-4)}`;
        const testUser = { ...adminData.systemUser, username: uniqueUsername };

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Admin module
        await admin.navigateToAdmin();

        // 3. Add User and verify success toast appears
        await admin.addUser(testUser);
    });

    test('ADM_003 - Search User by Role', async ({ page }) => {
        const login = new LoginPage(page);
        const admin = new AdminPage(page);

        const searchRole = adminData.searchByRole.role;

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Admin module
        await admin.navigateToAdmin();

        // 3. Select user role and click Search
        await admin.searchByRole(searchRole);

        // 4. Verify all displayed users have the selected role
        await admin.verifyAllRowsHaveRole(searchRole);
    });

    test('ADM_005 - Invalid User Search Test', async ({ page }) => {
        const login = new LoginPage(page);
        const admin = new AdminPage(page);

        const invalidUsername = adminData.invalidSearch.username;

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Admin module
        await admin.navigateToAdmin();

        // 3. Search with invalid username and verify No Records Found
        await admin.searchInvalidUser(invalidUsername);
    });

    test('ADM_007 - Delete System User Test', async ({ page }) => {
        const login = new LoginPage(page);
        const admin = new AdminPage(page);

        // Generate unique username to ensure it exists and we can delete it
        const uniqueUsername = `del.user.${Date.now().toString().slice(-4)}`;
        const testUser = { ...adminData.systemUser, username: uniqueUsername };

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Admin module
        await admin.navigateToAdmin();

        // 3. Add User (to ensure it exists)
        await admin.addUser(testUser);

        // 4. Delete the added user
        await admin.deleteUser(uniqueUsername);

        // 5. Verify user is no longer found (optional but good practice)
        await admin.searchInvalidUser(uniqueUsername);
    });

    test('ADM_008 - Edit System User Test', async ({ page }) => {
        const login = new LoginPage(page);
        const admin = new AdminPage(page);

        // Generate unique username to ensure it exists and we can edit it
        const uniqueUsername = `edit.user.${Date.now().toString().slice(-4)}`;
        const testUser = { ...adminData.systemUser, username: uniqueUsername, userRole: 'ESS' }; // Start as ESS

        const updatedDetails = {
            username: `upd.${uniqueUsername}`,
            userRole: 'Admin' // Change to Admin
        };

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Admin module
        await admin.navigateToAdmin();

        // 3. Add User (to ensure it exists as ESS)
        await admin.addUser(testUser);

        // 4. Edit the added user (Change role to Admin and update username)
        await admin.editUser(uniqueUsername, updatedDetails);
    });

});
