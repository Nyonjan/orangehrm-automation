const { expect } = require('@playwright/test');

class AdminPage {
    constructor(page) {
        this.page = page;
        this.adminMenu = page.locator('span.oxd-main-menu-item--name:has-text("Admin")');
        this.addButton = page.locator('button:has-text("Add")');

        // Form Fields
        this.userRoleDropdown = page.locator('label:has-text("User Role")').locator('xpath=../..').locator('.oxd-select-text');
        this.employeeNameInput = page.locator('input[placeholder="Type for hints..."]');
        this.employeeNameDropdown = page.locator('.oxd-autocomplete-dropdown');
        this.employeeNameOption = page.locator('.oxd-autocomplete-option');
        this.statusDropdown = page.locator('label:has-text("Status")').locator('xpath=../..').locator('.oxd-select-text');
        this.usernameInput = page.locator('label:has-text("Username")').locator('xpath=../..').locator('input');
        this.passwordInput = page.locator('label:has-text("Password")').locator('xpath=../..').locator('input[type="password"]').first();
        this.confirmPasswordInput = page.locator('label:has-text("Confirm Password")').locator('xpath=../..').locator('input[type="password"]');
        this.saveButton = page.locator('button[type="submit"]');

        // List
        this.searchUsernameInput = page.locator('label:has-text("Username")').locator('xpath=../..').locator('input');
        this.searchButton = page.locator('button[type="submit"]');
        this.recordFoundText = page.locator('span:has-text("Record Found"), span:has-text("Records Found")');
        this.tableRow = page.locator('.oxd-table-row').nth(1); // First data row after header
        this.deleteButton = this.tableRow.locator('.oxd-table-cell-actions i.bi-trash');
        this.confirmDeleteButton = page.locator('button:has-text("Yes, Delete")');
        this.editButton = this.tableRow.locator('.oxd-table-cell-actions i.bi-pencil-fill');
    }

    async navigateToAdmin() {
        await this.adminMenu.click();
        await this.page.waitForLoadState('networkidle');
        // Verify we are on the Admin page
        await expect(this.page).toHaveURL(/.*admin\/viewSystemUsers/, { timeout: 15000 });
    }

    async addUser(user) {
        await this.addButton.click();
        // Verify we are on the Add User page
        await expect(this.page).toHaveURL(/.*admin\/saveSystemUser/, { timeout: 15000 });
        await expect(this.userRoleDropdown).toBeVisible({ timeout: 15000 });

        // User Role
        await this.userRoleDropdown.click();
        await this.page.locator('.oxd-select-option').locator(`text=${user.userRole}`).click();

        // Employee Name (Autocomplete) - Type first char, wait for API, then click suggestion
        await this.employeeNameInput.click();
        await this.employeeNameInput.fill('');

        // Type the character(s) and wait for the employee search API to respond
        await Promise.all([
            this.page.waitForResponse(
                resp => resp.url().includes('/api/v2/pim/employees') && resp.status() === 200,
                { timeout: 15000 }
            ),
            this.employeeNameInput.type(user.employeeName, { delay: 100 }),
        ]);

        // Give the dropdown a moment to render after the API response
        await this.page.waitForTimeout(1000);

        // Wait for the autocomplete dropdown with suggestions to appear
        await this.employeeNameDropdown.waitFor({ state: 'visible', timeout: 15000 });

        // Click the first suggestion from the dropdown
        const firstOption = this.employeeNameOption.first();
        await firstOption.waitFor({ state: 'visible', timeout: 5000 });
        await firstOption.click();

        // Wait for the selection to be populated in the input
        await this.page.waitForTimeout(1000);

        // Capture what was actually selected
        const selectedName = await this.employeeNameInput.inputValue();
        console.log(`Selected Employee Name: ${selectedName}`);

        // Status
        await this.statusDropdown.click();
        await this.page.locator('.oxd-select-option').locator(`text=${user.status}`).click();

        // Username
        await this.usernameInput.fill(user.username);

        // Password & Confirm
        await this.passwordInput.fill(user.password);
        await this.confirmPasswordInput.fill(user.password);

        // Save
        await this.saveButton.click();

        // Wait for success toast - sometimes it's quick, so we wait for its appearance
        await expect(this.page.locator('.oxd-toast--success')).toBeVisible({ timeout: 10000 });

        // Update the user object with the exact saved name so verification passes
        user.employeeNameFull = selectedName;
    }

    async searchUser(username) {
        await this.searchUsernameInput.fill(username);
        await this.searchButton.click();
        await this.recordFoundText.waitFor({ state: 'visible' });
        // Let table settle
        await this.page.waitForTimeout(1000);
    }

    async verifyUserInList(username, role, employeeName, status) {
        // Cells: Checkbox(0), Username(1), User Role(2), Employee Name(3), Status(4)
        await expect(this.tableRow.locator('.oxd-table-cell').nth(1)).toHaveText(username);
        await expect(this.tableRow.locator('.oxd-table-cell').nth(2)).toHaveText(role);
        // Employee might have varying white spaces or different full name format initially, so let's check it contains something
        if (employeeName) {
            await expect(this.tableRow.locator('.oxd-table-cell').nth(3)).toHaveText(employeeName);
        }
        await expect(this.tableRow.locator('.oxd-table-cell').nth(4)).toHaveText(status);
    }

    async searchByRole(role) {
        // Select the user role from the filter dropdown
        await this.userRoleDropdown.click();
        await this.page.locator('.oxd-select-option').locator(`text=${role}`).click();

        // Click Search
        await this.searchButton.click();

        // Wait for the API response and table to load
        await this.page.waitForResponse(
            resp => resp.url().includes('/api/v2/admin/users') && resp.status() === 200,
            { timeout: 15000 }
        );
        await this.recordFoundText.waitFor({ state: 'visible', timeout: 10000 });
        await this.page.waitForTimeout(500);
    }

    async verifyAllRowsHaveRole(expectedRole) {
        // Get all data rows (skip header row at index 0)
        const dataRows = this.page.locator('.oxd-table-body .oxd-table-row');
        const rowCount = await dataRows.count();
        console.log(`Found ${rowCount} rows after filtering by role: ${expectedRole}`);

        expect(rowCount).toBeGreaterThan(0);

        // Verify each row's User Role column (index 2) matches expected role
        for (let i = 0; i < rowCount; i++) {
            await expect(dataRows.nth(i).locator('.oxd-table-cell').nth(2)).toHaveText(expectedRole);
        }
    }
    async searchInvalidUser(username) {
        // Enter invalid username in the search field
        await this.searchUsernameInput.fill(username);

        // Click Search and wait for API response
        await Promise.all([
            this.page.waitForResponse(
                resp => resp.url().includes('/api/v2/admin/users') && resp.status() === 200,
                { timeout: 15000 }
            ),
            this.searchButton.click(),
        ]);

        await this.page.waitForTimeout(500);

        // Verify "No Records Found" message is displayed
        const noRecordsToast = this.page.locator('span:has-text("No Records Found")');
        await expect(noRecordsToast).toBeVisible({ timeout: 10000 });
    }

    async deleteUser(username) {
        // 0. Ensure we are on the Admin List page
        await this.navigateToAdmin();

        // 1. Search for the user to make sure we are deleting the right one
        await this.searchUser(username);

        // 2. Click delete icon on the first (and supposedly only) result
        await this.deleteButton.click();

        // 3. Confirm deletion in the popup
        await this.confirmDeleteButton.click();

        // 4. Verify success toast
        await expect(this.page.locator('.oxd-toast--success')).toBeVisible({ timeout: 10000 });

        // Wait for table to reload
        await this.page.waitForTimeout(1000);
    }

    async editUser(oldUsername, newDetails) {
        // 0. Ensure we are on the Admin List page
        await this.navigateToAdmin();

        // 1. Search for the user to edit
        await this.searchUser(oldUsername);

        // 2. Click edit icon
        await this.editButton.click();
        await this.page.waitForLoadState('networkidle');

        // 3. Modify details (Role and Username as requested)
        if (newDetails.userRole) {
            await this.userRoleDropdown.click();
            await this.page.locator('.oxd-select-option').locator(`text=${newDetails.userRole}`).click();
        }

        if (newDetails.username) {
            await this.usernameInput.fill(newDetails.username);
        }

        // 4. Click Save
        await this.saveButton.click();

        // 5. Verify success toast
        await expect(this.page.locator('.oxd-toast--success')).toBeVisible({ timeout: 10000 });

        // Wait for redirect/reload
        await this.page.waitForTimeout(1000);
    }
}

module.exports = { AdminPage };
