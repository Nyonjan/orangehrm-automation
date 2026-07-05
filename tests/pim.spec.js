const { test, expect } = require('@playwright/test');
const { LoginPage } = require('../pageObjects/login.po');
const { PimPage } = require('../pageObjects/pim.po');
const loginData = require('../fixtures/loginFixture.json');
const pimData = require('../fixtures/pimFixture.json');

test.describe('OrangeHRM PIM Module', () => {

    test('PIM_001 - Add Employee Test', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to PIM module
        await pim.navigateToPim();

        // 3. Click on Add Employee
        await pim.clickAddEmployee();

        // 4. Enter employee details
        // 5. Click Save button
        const { firstName, middleName, lastName } = pimData.newEmployee;
        // Use a unique Employee ID to avoid "Employee Id already exists" error
        const uniqueId = `EMP${Date.now().toString().slice(-4)}`;
        await pim.addEmployee(firstName, middleName, lastName, uniqueId);

        // Verify employee should be added successfully.
        // Verify employee profile page should be displayed.
        await pim.verifyEmployeeCreated(firstName, lastName);
    });

    test('PIM_002 - Add Employee Without Required Fields', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to PIM module
        await pim.navigateToPim();

        // 3. Click on Add Employee
        await pim.clickAddEmployee();

        // 4. Leave required fields empty
        // 5. Click Save button
        await pim.addEmployee('', '', '', '', false);

        // Verify Required validation messages are displayed
        await pim.verifyRequiredFieldErrorMessages();
    });

    test('PIM_003 - Search Existing Employee Test', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Employee List (default PIM page)
        await pim.navigateToPim();

        // 3. Enter employee name
        // 4. Click Search button
        const { employeeName } = pimData.searchTestData;
        await pim.searchEmployee(employeeName);

        // Verify matching employee record should be displayed.
        await pim.verifySearchResult(employeeName);
    });

    test('PIM_004 - Invalid Employee Search Test', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Employee List
        await pim.navigateToPim();

        // 3. Enter invalid employee name
        // 4. Click Search button
        const { employeeName } = pimData.invalidSearchData;
        await pim.searchEmployee(employeeName);

        // Verify No Records Found message displayed successfully.
        await pim.verifyNoRecordsFound();
    });

    test('PIM_005 - Reset Search Filter Test', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);
        await login.verifyValidLogin();

        // 2. Navigate to Employee List
        await pim.navigateToPim();

        // 3. Enter employee name
        const { employeeName } = pimData.searchTestData;
        await page.locator(pim.employeeNameSearchInput).fill(employeeName);

        // 4. Click Reset button
        await pim.clickReset();

        // Verify Search fields should be cleared.
        await pim.verifySearchFieldsCleared();
    });

    test('PIM_006 - Edit Employee Information Test (Nepali Data)', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // Test Data
        const firstName = 'Ram';
        const lastName = 'Shrestha';
        const updatedLastName = 'Thapa';
        const uniqueId = `NP${Date.now().toString().slice(-4)}`;

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);

        // 2. Add Employee (Setup Data)
        await pim.navigateToPim();
        await pim.clickAddEmployee();
        await pim.addEmployee(firstName, 'A', lastName, uniqueId);
        await pim.verifyEmployeeCreated(firstName, lastName);

        // 3. Search for the added employee using Unique ID
        await pim.navigateToPim();
        await pim.searchByEmployeeId(uniqueId);

        // 4. Open employee profile
        await pim.clickEmployeeById(uniqueId);

        // 5. Edit employee details (Change Last Name)
        await pim.updateEmployeeDetails(undefined, undefined, updatedLastName);

        // 6. Final Assertion: Verify updated name is reflected (already verified inside POM, but one more to be sure)
        await expect(page.locator(pim.employeeNameHeader)).toContainText(updatedLastName, { timeout: 30000 });
    });

    test('PIM_007 - Delete Employee Test', async ({ page }) => {
        const login = new LoginPage(page);
        const pim = new PimPage(page);

        // Test Data
        const firstName = 'Hari';
        const lastName = 'Karki';
        const uniqueId = `DEL${Date.now().toString().slice(-4)}`;

        // 1. Login to application
        await login.navigate();
        await login.login(loginData.validUser.username, loginData.validUser.password);

        // 2. Add Employee (Setup Data)
        await pim.navigateToPim();
        await pim.clickAddEmployee();
        await pim.addEmployee(firstName, 'A', lastName, uniqueId);
        await pim.verifyEmployeeCreated(firstName, lastName);

        // 3. Navigate back to Employee List
        await pim.navigateToPim();

        // 4. Search for the added employee using Unique ID
        await pim.searchByEmployeeId(uniqueId);

        // 5. Delete the employee
        await pim.deleteEmployee(uniqueId);

        // 6. Verify Deletion
        await pim.searchByEmployeeId(uniqueId);
        await pim.verifyNoRecordsFound();
    });

});
