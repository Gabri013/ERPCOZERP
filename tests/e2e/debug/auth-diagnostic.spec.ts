import { test, expect, chromium } from '@playwright/test';

test.describe('Auth Diagnostic', () => {
  test('trace login flow and API calls', async ({ page }) => {
    const baseUrl = 'http://127.0.0.1:5173';
    const apiUrl = 'http://127.0.0.1:3001';

    // Intercept API responses
    const responses: Record<string, any> = {};
    
    page.on('response', async (response) => {
      const url = response.url();
      const status = response.status();
      const contentType = response.headers()['content-type'] || '';
      
      try {
        const body = await response.text();
        const key = `${response.request().method()} ${url}`;
        responses[key] = { status, contentType, body: body.slice(0, 500) };
        console.log(`[${status}] ${response.request().method()} ${url}`);
        if (body) console.log(`  Body: ${body.slice(0, 200)}`);
      } catch (e) {
        console.log(`[${status}] ${response.request().method()} ${url} (no body)`);
      }
    });

    // Go to login page
    console.log('\n=== STEP 1: Navigate to login ===');
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Fill login form
    console.log('\n=== STEP 2: Fill login form ===');
    await page.fill('input[type="email"], input[name="email"]', 'gerente@cozinha.com');
    await page.fill('input[type="password"]', 'demo123_dev');

    // Submit form
    console.log('\n=== STEP 3: Submit login form ===');
    await page.click('button[type="submit"]');

    // Wait for responses
    await page.waitForTimeout(3000);

    // Check localStorage
    console.log('\n=== STEP 4: Check localStorage ===');
    const tokens = await page.evaluate(() => {
      return {
        access_token: localStorage.getItem('access_token'),
        token: localStorage.getItem('token'),
        authToken: localStorage.getItem('authToken'),
      };
    });
    console.log('Tokens:', tokens);

    // Check current URL
    console.log('\n=== STEP 5: Check current page ===');
    console.log('Current URL:', page.url());
    console.log('Is on login:', page.url().includes('login'));

    // Try to manually call API with token
    if (tokens.access_token || tokens.token) {
      console.log('\n=== STEP 6: Manual API call ===');
      const token = tokens.access_token || tokens.token;
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`/api/auth/me: ${res.status}`);
      const data = await res.text();
      console.log(`Response: ${data.slice(0, 300)}`);
    }

    console.log('\n=== All API Responses ===');
    Object.entries(responses).forEach(([key, value]: [string, any]) => {
      console.log(`${key}: ${value.status}`);
    });

    // Wait a bit more and take screenshot
    await page.screenshot({ path: 'test-results/auth-diagnostic-screenshot.png' });
  });
});
