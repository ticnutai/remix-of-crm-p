import { test, Page } from '@playwright/test';

async function loginIfNeeded(page: Page) {
  if (page.url().includes('/auth') || page.url().includes('login')) {
    await page.fill('input[type="email"]', 'jj1212t@gmail.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || '543211');
    await page.click('button[type="submit"]');
    await page.waitForURL(u => !u.toString().includes('/auth'), { timeout: 20000 });
    console.log('OK logged in');
  }
}

test('ChatFilePicker Gmail Tab Debug', async ({ page }) => {
  page.setDefaultTimeout(30000);
  const logs: Array<{ type: string; text: string }> = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));

  // 1. Login + navigate
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await loginIfNeeded(page);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/01-login.png', fullPage: true });

  // 2. Go to /smart-tools and click messenger tab
  await page.goto('http://localhost:8080/smart-tools', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log('\n== RLS check ==');
  const rlsErrors = logs.filter(l => l.text.includes('infinite recursion'));
  console.log('RLS errors:', rlsErrors.length === 0 ? '✅ none' : rlsErrors.map(e => e.text).join(', '));

  // Click messenger tab
  const messengerTab = page.locator('[value="messenger"]').or(page.locator('button:has-text("שיחות")'));
  if (await messengerTab.count() > 0) {
    await messengerTab.first().click();
    await page.waitForTimeout(3000);
    console.log('Clicked messenger tab');
  }
  await page.screenshot({ path: 'test-results/02-messenger.png', fullPage: true });

  // 3. Check conversations - "אין שיחות" = need to create one
  const noConvs = await page.locator('text=אין שיחות').count();
  console.log('\n== Conversations:', noConvs > 0 ? 'NONE - creating...' : 'exist');

  if (noConvs > 0) {
    // Click "חדש" button to create a conversation
    const newBtn = page.locator('button:has-text("חדש")').or(page.locator('button:has-text("new")'));
    console.log('New button count:', await newBtn.count());
    if (await newBtn.count() > 0) {
      await newBtn.first().click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/03-new-conv-dialog.png', fullPage: true });

      // In Dialog: find input for conversation name
      const nameInput = page.locator('[role="dialog"] input').first();
      // Must select 'group' type first - internal requires participants
      const groupTypeBtn = page.locator('[role="dialog"] button:has-text("קבוצה")');
      if (await groupTypeBtn.count() > 0) {
        await groupTypeBtn.click();
        await page.waitForTimeout(300);
        console.log('  Selected group type');
      }
      if (await nameInput.count() > 0) {
        await nameInput.fill('בדיקת E2E');
        await page.waitForTimeout(500);
      }

      // Click create/submit button
      const submitBtn = page.locator('[role="dialog"] button:has-text("צור"), [role="dialog"] button:has-text("יצירה"), [role="dialog"] button[type="submit"]').last();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForTimeout(2000);
        console.log('Created conversation');
      } else {
        // try pressing Enter
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }
      await page.screenshot({ path: 'test-results/03b-after-create.png', fullPage: true });
    }
  }

  // 4. Click first conversation - scroll sidebar into view
  console.log('\n== Click conversation ==');
  await page.waitForTimeout(1000);
  // ConvItem button: has avatar + text, inside the sidebar
  const convSelectors = [
    // ChatMessenger ConvItem: w-full flex items-start gap-2.5 px-2.5 py-2 rounded-xl
    'button[class*="items-start"][class*="rounded-xl"]',
    // Fallback
    '[class*="ChatMessenger"] button.w-full',
  ];

  let convOpened = false;
  for (const sel of convSelectors) {
    const els = page.locator(sel);
    const cnt = await els.count();
    console.log(`Selector "${sel}": ${cnt}`);
    if (cnt > 0) {
      // Scroll to it first
      await els.first().scrollIntoViewIfNeeded();
      await els.first().click({ force: true });
      convOpened = true;
      console.log('Opened conversation');
      await page.waitForTimeout(1500);
      break;
    }
  }

  await page.screenshot({ path: 'test-results/04-conv-open.png', fullPage: true });
  console.log('Conv opened:', convOpened);

  // 5. Find Paperclip button
  console.log('\n== Paperclip ==');
  const allSvgBtns = await page.locator('button:has(svg)').all();
  console.log(`SVG buttons: ${allSvgBtns.length}`);
  let paperclipClicked = false;

  for (let i = 0; i < allSvgBtns.length; i++) {
    const html = await allSvgBtns[i].innerHTML().catch(() => '');
    const title = await allSvgBtns[i].getAttribute('title').catch(() => '');
    const aria = await allSvgBtns[i].getAttribute('aria-label').catch(() => '');
    if (html.includes('Paperclip') || html.includes('paperclip') ||
        title?.includes('קובץ') || title?.includes('צרף') || title?.includes('attach') ||
        aria?.includes('attach') || aria?.includes('file')) {
      console.log(`Found Paperclip btn[${i}]: title="${title}" aria="${aria}"`);
      await allSvgBtns[i].scrollIntoViewIfNeeded();
      await allSvgBtns[i].click({ force: true });
      paperclipClicked = true;
      await page.waitForTimeout(2000); // wait for dialog to open
      break;
    }
  }
  if (!paperclipClicked) console.log('⚠️  Paperclip not found by content — printing SVG btn titles:',
    (await Promise.all(allSvgBtns.slice(0,30).map(b => b.getAttribute('title').catch(() => '')))).join(' | '));

  await page.screenshot({ path: 'test-results/05-after-paperclip.png', fullPage: true });

  // 6. Dialog
  console.log('\n== Dialog ==');
  let dialogOpen = await page.locator('[role="dialog"]').count() > 0;
  console.log('Dialog open:', dialogOpen);

  // If not open, try SVG buttons one by one to find the file picker
  if (!dialogOpen) {
    for (let i = 0; i < allSvgBtns.length && !dialogOpen; i++) {
      try { await allSvgBtns[i].scrollIntoViewIfNeeded(); await allSvgBtns[i].click({ force: true }); } catch { continue; }
      await page.waitForTimeout(400);
      if (await page.locator('[role="dialog"]').count() > 0) {
        const t = await page.locator('[role="dialog"] [class*="Title"], [role="dialog"] h2, [role="dialog"] h3').first().textContent().catch(() => '');
        if (t && (t.includes('קובץ') || t.includes('בחר') || t.includes('Gmail') || t.includes('Drive') || t.includes('Upload'))) {
          console.log(`Dialog opened with btn[${i}]: "${t}"`);
          dialogOpen = true;
        } else {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    }
  }

  await page.screenshot({ path: 'test-results/06-dialog.png', fullPage: true });

  // 7. Interact with file picker tabs
  console.log('\n== File picker tabs ==');
  if (dialogOpen) {
    const tabs = page.locator('[role="dialog"] [role="tab"]');
    const tc = await tabs.count();
    console.log(`Tabs: ${tc}`);
    for (let i = 0; i < tc; i++) {
      const t = await tabs.nth(i).textContent().catch(() => '');
      const s = await tabs.nth(i).getAttribute('data-state').catch(() => '');
      console.log(`  Tab[${i}]: "${t?.trim()}" (${s})`);
    }

    // Click Gmail
    const gmailTab = tabs.filter({ hasText: /gmail/i });
    if (await gmailTab.count() > 0) {
      await gmailTab.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: 'test-results/07-gmail.png', fullPage: true });

      const pLogs = logs.filter(l => l.text.includes('[ChatFilePicker]') || l.text.includes('[GmailTab]'));
      console.log(`ChatFilePicker logs: ${pLogs.length}`);
      pLogs.forEach(l => console.log(`  [${l.type}] ${l.text}`));

      const spin = await page.locator('[role="dialog"] [class*="animate-spin"]').count();
      console.log(`Spinner: ${spin > 0 ? '🔄 spinning (might be stuck)' : '✅ none'}`);

      // Tab states after Gmail
      for (let i = 0; i < tc; i++) {
        console.log(`  Tab[${i}] now: "${(await tabs.nth(i).textContent() || '').trim()}" (${await tabs.nth(i).getAttribute('data-state')})`);
      }

      // Click Upload
      const uploadTab = tabs.filter({ hasText: /העלאה|העלה|upload/i });
      if (await uploadTab.count() > 0) {
        await uploadTab.click();
        await page.waitForTimeout(1000);
        const us = await uploadTab.getAttribute('data-state');
        console.log(`\nUpload after click: "${us}" ${us === 'active' ? '✅ WORKS' : '❌ BROKEN'}`);
        await page.screenshot({ path: 'test-results/08-upload-after-gmail.png', fullPage: true });
      }
    } else {
      console.log('⚠️  Gmail tab not found');
      const dHTML = await page.locator('[role="dialog"]').innerHTML().catch(() => '');
      console.log('Dialog HTML (500):', dHTML.slice(0, 500));
    }
  } else {
    console.log('⚠️  Dialog never opened');
    if (!convOpened) console.log('💡 Reason: no conversation was opened — paperclip only appears in open chats');
  }

  // Summary
  console.log('\n== SUMMARY ==');
  const allPickerLogs = logs.filter(l => l.text.includes('[ChatFilePicker]') || l.text.includes('[GmailTab]'));
  console.log(`[ChatFilePicker] logs: ${allPickerLogs.length} ${allPickerLogs.length === 0 ? '⚠️ (no debug code loaded?)' : '✅'}`);
  console.log(`Console errors: ${logs.filter(l => l.type === 'error').length}`);
  console.log('Screenshots: test-results/0*.png');
});

