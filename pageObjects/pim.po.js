const { expect } = require('@playwright/test');

exports.PimPage = class PimPage {
    constructor(page) {
        this.page = page;

        // Locators
        this.pimSidebarLink = 'a.oxd-main-menu-item:has-text("PIM")';
        this.addEmployeeTab = 'a.oxd-topbar-body-nav-tab-item:has-text("Add Employee")';
        this.firstNameInput = 'input[name="firstName"]';
        this.middleNameInput = 'input[name="middleName"]';
        this.lastNameInput = 'input[name="lastName"]';
        this.employeeIdInput = '.oxd-input-group:has(label:has-text("Employee Id")) input';
        this.saveButton = 'button[type="submit"]';
        this.successToast = 'div.oxd-toast--success';
        this.employeeNameHeader = '.orangehrm-edit-employee-name h6';
        this.requiredErrorMessages = '.oxd-input-field-error-message';
        this.employeeNameSearchInput = '.oxd-input-group:has(label:has-text("Employee Name")) input';
        this.employeeIdSearchInput = '.oxd-input-group:has(label:has-text("Employee Id")) input';
        this.searchButton = 'button:has-text("Search")';
        this.resetButton = 'button:has-text("Reset")';
        this.tableResultFirstNameCell = '.oxd-table-cell:nth-child(3)';
        this.tableResultLastNameCell = '.oxd-table-cell:nth-child(4)';
        this.noRecordsFoundMessage = '//span[text()="No Records Found"]';
        this.confirmDeleteButton = '//button[contains(., "Yes, Delete")]';
    }

    // Actions
    async navigateToPim() {
        await this.page.locator(this.pimSidebarLink).waitFor({ state: 'visible', timeout: 30000 });
        await this.page.locator(this.pimSidebarLink).click();
        await this.page.waitForLoadState('networkidle');
        // Verify we are on the PIM page
        await expect(this.page).toHaveURL(/.*pim\/viewEmployeeList/, { timeout: 15000 });
    }

    async clickAddEmployee() {
        await this.page.locator(this.addEmployeeTab).waitFor({ state: 'visible', timeout: 30000 });
        await this.page.locator(this.addEmployeeTab).click();
        // Verify we are on the Add Employee page
        await expect(this.page).toHaveURL(/.*pim\/addEmployee/, { timeout: 15000 });
    }

    async addEmployee(firstName, middleName, lastName, employeeId, expectSuccess = true) {
        await this.page.locator(this.firstNameInput).waitFor({ state: 'visible', timeout: 15000 });
        await this.page.locator(this.firstNameInput).fill(firstName);
        await this.page.locator(this.middleNameInput).fill(middleName);
        await this.page.locator(this.lastNameInput).fill(lastName);

        if (employeeId) {
            // Clear the default ID and fill the new one
            await this.page.locator(this.employeeIdInput).clear();
            await this.page.locator(this.employeeIdInput).fill(employeeId);
        }

        await this.page.locator(this.saveButton).click();

        if (expectSuccess) {
            // Wait for success toast immediately after click
            await expect(this.page.locator(this.successToast)).toBeVisible({ timeout: 15000 });

            // Wait for redirection to employee profile page
            await this.page.waitForURL(/viewPersonalDetails/, { timeout: 60000 });
            await this.page.waitForLoadState('load');
        }
    }

    async verifyEmployeeCreated(firstName, lastName) {
        // Success toast is verified inside addEmployee or we check for visibility/existence if not already gone
        const toast = this.page.locator(this.successToast);

        // Only wait if it's still possibly there, or just rely on the redirected state
        // In many cases, redirection to the profile page IS sufficient proof of creation.

        // Verify redirection to profile page and header name
        const fullName = `${firstName} ${lastName}`;
        const header = this.page.locator(this.employeeNameHeader);
        await header.waitFor({ state: 'visible', timeout: 30000 });

        // Use a custom polling expect to ensure we wait for the text to BE the expected value,
        // specifically avoiding returning true for old values if they matched substrings.
        await expect(header).toHaveText(new RegExp(fullName), { timeout: 30000 });
    }

    async verifyRequiredFieldErrorMessages() {
        // Wait for at least one error message to appear
        const errorMessages = this.page.locator(this.requiredErrorMessages);
        await expect(errorMessages.first()).toBeVisible({ timeout: 10000 });

        // Count and verify
        const count = await errorMessages.count();
        expect(count).toBeGreaterThan(0);

        // Verify all visible error messages have text "Required"
        for (let i = 0; i < count; i++) {
            await expect(errorMessages.nth(i)).toHaveText('Required');
        }
    }

    async searchEmployee(name) {
        // Wait for search input and fill
        await this.page.locator(this.employeeNameSearchInput).waitFor({ state: 'visible', timeout: 30000 });
        await this.page.locator(this.employeeNameSearchInput).fill(name);

        // Click Search
        await this.page.locator(this.searchButton).click();

        // Wait for the AJAX heavy search to resolve and table to update
        await this.page.waitForLoadState('networkidle', { timeout: 45000 });
    }

    async searchByEmployeeId(employeeId) {
        // Wait for search input and fill
        const idField = this.page.locator(this.employeeIdSearchInput).first();
        await idField.waitFor({ state: 'visible', timeout: 30000 });
        await idField.clear();
        await idField.fill(employeeId);

        // Click Search
        await this.page.locator(this.searchButton).click();

        // Wait for table to update
        await this.page.waitForLoadState('networkidle', { timeout: 45000 });
    }

    async clickEmployeeById(employeeId) {
        // Find row by ID
        const employeeRow = this.page.locator('.oxd-table-card')
            .filter({ hasText: employeeId });

        await employeeRow.first().waitFor({ state: 'visible', timeout: 30000 });
        await employeeRow.first().click();

        // Wait for redirection to employee details page
        await this.page.waitForURL(/viewPersonalDetails/, { timeout: 40000 });
    }


    async clickReset() {
        await this.page.locator(this.resetButton).click();
        await this.page.waitForLoadState('networkidle');
    }

    async verifySearchFieldsCleared() {
        // Verify employee name input is empty
        const nameValue = await this.page.locator(this.employeeNameSearchInput).inputValue();
        expect(nameValue).toBe('');
        // Also verify URL is correct
        await expect(this.page).toHaveURL(/.*pim\/viewEmployeeList/);
    }

    async verifySearchResult(expectedName) {
        // Verify that the first result matches the expected name
        const firstRow = this.page.locator('.oxd-table-card').first();
        await firstRow.waitFor({ state: 'visible', timeout: 60000 });

        const firstName = await firstRow.locator(this.tableResultFirstNameCell).innerText();
        const lastName = await firstRow.locator(this.tableResultLastNameCell).innerText();
        const fullName = `${firstName.trim()} ${lastName.trim()}`;

        // Normalize and check
        const normalizedFullName = fullName.toLowerCase();
        const parts = expectedName.toLowerCase().split(' ');

        for (const part of parts) {
            expect(normalizedFullName).toContain(part);
        }
    }

    async verifyNoRecordsFound() {
        // Verify "No Records Found" message is displayed
        await this.page.locator(this.noRecordsFoundMessage).waitFor({ state: 'visible', timeout: 15000 });
        await expect(this.page.locator(this.noRecordsFoundMessage)).toBeVisible();
    }

    async updateEmployeeDetails(firstName, middleName, lastName) {
        // Wait for first name input to be available on profile page
        const firstNameField = this.page.locator(this.firstNameInput);
        const middleNameField = this.page.locator(this.middleNameInput);
        const lastNameField = this.page.locator(this.lastNameInput);

        await firstNameField.waitFor({ state: 'visible', timeout: 30000 });

        if (firstName !== undefined) {
            await firstNameField.click();
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await firstNameField.fill(firstName);
        }
        if (middleName !== undefined) {
            await middleNameField.click();
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await middleNameField.fill(middleName);
        }
        if (lastName !== undefined) {
            await lastNameField.click();
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await lastNameField.fill(lastName);
            // Verify value is registered before clicking Save
            await expect(lastNameField).toHaveValue(lastName);
        }

        // Target specifically the first Save button in the 'Personal Details' section
        const saveButton = this.page.locator('.orangehrm-horizontal-padding').filter({ hasText: 'Personal Details' }).locator('button[type="submit"]').first();

        // Click Save and wait for the API response
        const responsePromise = this.page.waitForResponse(response =>
            response.url().includes('/personal-details') &&
            (response.request().method() === 'PUT' || response.request().method() === 'POST') &&
            response.status() === 200,
            { timeout: 45000 }
        );

        await saveButton.click();
        await responsePromise;

        // Verify success toast
        await expect(this.page.locator(this.successToast)).toBeVisible({ timeout: 20000 });

        // Force a page reload to ensure the UI reflects the saved state
        await this.page.reload();
        await this.page.waitForLoadState('load');
        await this.page.waitForLoadState('networkidle');

        // Robust header check: wait for visibility and ensure it eventually contains the new value
        const header = this.page.locator(this.employeeNameHeader);
        await header.waitFor({ state: 'visible', timeout: 30000 });

        if (lastName !== undefined) {
            await expect(header).toContainText(lastName, { timeout: 30000 });
        }
    }

    async deleteEmployee(employeeId) {
        // Find the specific row by ID and click its delete icon
        const deleteIcon = this.page.locator(`//div[@role='row'][descendant::text()='${employeeId}']//i[contains(@class, 'bi-trash')]/parent::button`);
        await deleteIcon.waitFor({ state: 'visible', timeout: 30000 });
        await deleteIcon.click();

        // Wait for confirmation dialog and click 'Yes, Delete'
        const confirmBtn = this.page.locator(this.confirmDeleteButton);
        await confirmBtn.waitFor({ state: 'visible', timeout: 30000 });
        await confirmBtn.click();

        // Wait for success toast and network to be idle
        await expect(this.page.locator(this.successToast)).toBeVisible({ timeout: 15000 });
        await this.page.waitForLoadState('networkidle', { timeout: 45000 });
    }
};
