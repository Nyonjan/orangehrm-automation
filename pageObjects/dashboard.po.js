const { expect } = require('@playwright/test');

class DashboardPage {
    constructor(page) {
        this.page = page;
        // Sidebar menu items
        this.menuAdmin = page.locator('span.oxd-main-menu-item--name:has-text("Admin")');
        this.menuPim = page.locator('span.oxd-main-menu-item--name:has-text("PIM")');
        this.menuLeave = page.locator('span.oxd-main-menu-item--name:has-text("Leave")');

        // Page header breadcrumb to verify navigation
        this.breadcrumbLabel = page.locator('.oxd-topbar-header-breadcrumb-module');
    }

    async navigateToModule(moduleName) {
        let menuLocator;
        switch (moduleName.toLowerCase()) {
            case 'admin':
                menuLocator = this.menuAdmin;
                break;
            case 'pim':
                menuLocator = this.menuPim;
                break;
            case 'leave':
                menuLocator = this.menuLeave;
                break;
            default:
                throw new Error(`Module ${moduleName} not implemented in Page Object`);
        }

        await menuLocator.click();
        await this.page.waitForLoadState('networkidle');

        // Verify the breadcrumb reflects the current module successfully
        await expect(this.breadcrumbLabel).toHaveText(moduleName, { ignoreCase: true });

        // Verify URL pattern matches the module
        const urlPattern = new RegExp(`.*${moduleName.toLowerCase()}`);
        await expect(this.page).toHaveURL(urlPattern, { timeout: 15000 });
    }
}

module.exports = { DashboardPage };
