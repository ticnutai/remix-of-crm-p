/**
 * Gmail Connect Button Test
 * Logs in → navigates to Gmail → clicks "התחבר" → reports everything that happens
 */
import { test, expect } from "@playwright/test";

test("Gmail - click connect button and observe", async ({ page }) => {
  // Collect all console messages
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    if (msg.type() === "error") consoleErrors.push(text);
  });

  // Collect all network requests/responses
  const networkErrors: string[] = [];
  const networkRequests: string[] = [];
  page.on("response", (res) => {
    const url = res.url();
    const status = res.status();
    if (status >= 400) {
      networkErrors.push(`${status} ${url.substring(0, 120)}`);
    }
    // Track Google-related requests
    if (url.includes("google") || url.includes("gmail") || url.includes("gsi") || url.includes("oauth")) {
      networkRequests.push(`${status} ${url.substring(0, 150)}`);
    }
  });

  // Track page errors (uncaught exceptions)
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  // Track popups (OAuth windows)
  const popups: string[] = [];
  page.on("popup", (popup) => {
    popups.push(`Popup opened: ${popup.url()}`);
    console.log(`🔔 POPUP DETECTED: ${popup.url()}`);
  });

  // Track dialogs (alert/confirm/prompt)
  const dialogs: string[] = [];
  page.on("dialog", async (dialog) => {
    dialogs.push(`Dialog [${dialog.type()}]: ${dialog.message()}`);
    await dialog.dismiss();
  });

  // ===== PHASE 1: Login =====
  console.log("=== PHASE 1: Login ===");
  await page.goto("http://localhost:8080/auth");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  // The login form has id="login-email" and id="login-password"
  const emailInput = page.locator('#login-email');
  const passwordInput = page.locator('#login-password');
  
  if (await emailInput.isVisible({ timeout: 5000 })) {
    console.log("📝 Filling login form...");
    await emailInput.fill("jj1212t@gmail.com");
    await passwordInput.fill("543211");
    
    // Click the submit button inside the login form
    const loginBtn = page.locator('form button[type="submit"]').first();
    await loginBtn.click();
    console.log("🖱️ Clicked login button, waiting for redirect...");
    
    // Wait for navigation away from /auth
    await page.waitForURL((url) => !url.pathname.includes("/auth"), { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);
    console.log("✅ Login done, current URL:", page.url());
  } else {
    console.log("⚠️ No login form found, checking if already logged in...");
    console.log("Current URL:", page.url());
    // Take screenshot to see what's on screen
    await page.screenshot({ path: "test-results/gmail-login-not-found.png", fullPage: true });
  }

  // ===== PHASE 2: Navigate to Gmail =====
  console.log("\n=== PHASE 2: Navigate to Gmail ===");
  
  // Clear counters before Gmail navigation
  const preGmailErrors = [...consoleErrors];
  const preGmailNetwork = [...networkErrors];
  
  await page.goto("http://localhost:8080/gmail");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(2000);
  
  console.log("📍 Current URL:", page.url());
  
  // ===== PHASE 3: Screenshot BEFORE clicking connect =====
  console.log("\n=== PHASE 3: State before connect ===");
  await page.screenshot({ path: "test-results/gmail-before-connect.png", fullPage: true });
  
  // Check what's visible on the page
  const pageContent = await page.textContent("body");
  const hasConnectButton = pageContent?.includes("התחבר") || false;
  const hasAlreadyConnected = pageContent?.includes("דואר נכנס") || pageContent?.includes("inbox") || false;
  
  console.log(`Connect button visible: ${hasConnectButton}`);
  console.log(`Already connected (shows inbox): ${hasAlreadyConnected}`);
  
  // Check localStorage for existing Gmail accounts
  const gmailAccountsStored = await page.evaluate(() => {
    const stored = localStorage.getItem("gmail_accounts");
    return stored ? JSON.parse(stored) : null;
  });
  console.log("Gmail accounts in localStorage:", JSON.stringify(gmailAccountsStored, null, 2));
  
  // ===== PHASE 4: Find and click the connect button =====
  console.log("\n=== PHASE 4: Click Connect Button ===");
  
  // Try different selectors for the connect button
  const connectSelectors = [
    'button:has-text("התחבר עכשיו")',
    'button:has-text("התחבר ל-Gmail")',
    'button:has-text("התחבר")',
    'button:has-text("Connect")',
  ];
  
  let connectButton = null;
  let usedSelector = "";
  for (const sel of connectSelectors) {
    const btn = page.locator(sel).first();
    if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
      connectButton = btn;
      usedSelector = sel;
      break;
    }
  }
  
  if (!connectButton) {
    console.log("❌ No connect button found. Possible states:");
    console.log("  - Already connected to Gmail");
    console.log("  - Page didn't load correctly");
    
    // Take screenshot showing current state
    await page.screenshot({ path: "test-results/gmail-no-connect-button.png", fullPage: true });
    
    // List all buttons on the page
    const allButtons = await page.locator("button").allTextContents();
    console.log("All buttons on page:", allButtons.filter(b => b.trim()).join(" | "));
    
    // Still continue to check for errors
  } else {
    console.log(`✅ Found connect button with selector: ${usedSelector}`);
    const buttonText = await connectButton.textContent();
    console.log(`Button text: "${buttonText}"`);
    
    // Clear console errors before clicking
    consoleErrors.length = 0;
    networkErrors.length = 0;
    pageErrors.length = 0;
    popups.length = 0;
    
    // Click the connect button
    console.log("🖱️ Clicking connect button...");
    
    // Use Promise.race to handle popup OR error
    const clickResult = await Promise.race([
      (async () => {
        await connectButton!.click();
        // Wait a bit for any reaction
        await page.waitForTimeout(3000);
        return "clicked-no-popup";
      })(),
      (async () => {
        // Wait for popup (OAuth window)
        const popup = await page.waitForEvent("popup", { timeout: 10000 }).catch(() => null);
        if (popup) {
          return `popup-opened: ${popup.url()}`;
        }
        return "no-popup-timeout";
      })(),
    ]);
    
    console.log(`Click result: ${clickResult}`);
    
    // Wait a bit more for any async effects
    await page.waitForTimeout(3000);
    
    // Take screenshot AFTER clicking
    await page.screenshot({ path: "test-results/gmail-after-connect.png", fullPage: true });
  }

  // ===== PHASE 5: Check loading state =====
  console.log("\n=== PHASE 5: Loading/connecting state ===");
  
  const isLoadingVisible = await page.locator('text="מתחבר..."').isVisible({ timeout: 1000 }).catch(() => false);
  const hasSpinner = await page.locator(".animate-spin").isVisible({ timeout: 1000 }).catch(() => false);
  console.log(`Loading text visible: ${isLoadingVisible}`);
  console.log(`Spinner visible: ${hasSpinner}`);

  // ===== PHASE 6: Check for toast/notification =====
  console.log("\n=== PHASE 6: Toasts/Notifications ===");
  
  const toasts = await page.locator('[data-sonner-toast], [role="status"], [data-state="open"][role="alertdialog"], .toast, [data-radix-collection-item]').allTextContents();
  if (toasts.length > 0) {
    console.log("Toasts found:", toasts.join(" | "));
  } else {
    console.log("No toasts/notifications visible");
  }
  
  // Check for error markers in the page
  const errorBadges = await page.locator('[variant="destructive"], .text-destructive, .text-red-500').allTextContents();
  if (errorBadges.length > 0) {
    console.log("Error elements found:", errorBadges.join(" | "));
  }

  // ===== FINAL SUMMARY =====
  console.log("\n========================================");
  console.log("         FINAL SUMMARY");
  console.log("========================================");
  console.log(`Console errors (total): ${consoleErrors.length}`);
  consoleErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 200)}`));
  
  console.log(`\nNetwork errors (total): ${networkErrors.length}`);
  networkErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  
  console.log(`\nPage JS errors: ${pageErrors.length}`);
  pageErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e.substring(0, 200)}`));
  
  console.log(`\nPopups opened: ${popups.length}`);
  popups.forEach((p) => console.log(`  - ${p}`));
  
  console.log(`\nDialogs: ${dialogs.length}`);
  dialogs.forEach((d) => console.log(`  - ${d}`));
  
  console.log(`\nGoogle-related network requests: ${networkRequests.length}`);
  networkRequests.forEach((r) => console.log(`  - ${r}`));
  
  // Log all console messages related to Gmail
  const gmailLogs = consoleLogs.filter(l => 
    l.toLowerCase().includes("gmail") || 
    l.toLowerCase().includes("google") || 
    l.toLowerCase().includes("oauth") || 
    l.toLowerCase().includes("gsi") ||
    l.toLowerCase().includes("token")
  );
  console.log(`\nGmail-related console logs: ${gmailLogs.length}`);
  gmailLogs.forEach((l) => console.log(`  - ${l.substring(0, 200)}`));

  // The test passes regardless - we just want to observe
  expect(true).toBe(true);
});
