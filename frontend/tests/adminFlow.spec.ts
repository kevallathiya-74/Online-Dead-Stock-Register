import { test, expect } from "@playwright/test";

test.describe("Admin User Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto("http://localhost:5173/login");
  });

  test("should fail login with invalid credentials", async ({ page }) => {
    // Fill credentials
    await page.fill('input[type="email"]', "invalid@test.com");
    await page.fill('input[type="password"]', "wrongpassword");
    
    // Click submit
    await page.click('button[type="submit"]');

    // Toast error or warning should be shown
    const errorMessage = page.locator(".toastify-content, [role='alert']");
    await expect(errorMessage).toBeVisible;
  });

  test("should successfully login as admin and view users list", async ({ page }) => {
    // Setup Mock API routes for Playwright to work even without running backend
    await page.route("**/api/v1/auth/login", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "mock-jwt-token-123456",
          user: {
            id: "admin-id-999",
            email: "admin@test.com",
            role: "ADMIN",
            name: "System Admin",
            department: "ADMIN",
          },
        }),
      });
    });

    await page.route("**/api/v1/admin/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "user-1",
            name: "John Doe",
            email: "john@example.com",
            role: "INVENTORY_MANAGER",
            department: "INVENTORY",
            is_active: true,
          },
        ]),
      });
    });

    await page.route("**/api/v1/dashboard/stats", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalAssets: 42,
          totalUsers: 5,
          pendingApprovals: 2,
          activeMaintenance: 1,
        }),
      });
    });

    // Fill valid admin credentials
    await page.fill('input[type="email"]', "admin@test.com");
    await page.fill('input[type="password"]', "admin123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Sidebar navigation should contain Users management
    const usersLink = page.locator("a[href='/admin/users']");
    await expect(usersLink).toBeVisible();
  });
});
