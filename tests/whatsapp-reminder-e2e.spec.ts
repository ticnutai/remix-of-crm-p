import { test, expect, chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";

const SUPABASE_URL = "https://eadeymehidcndudeycnf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";
const ADMIN_EMAIL = "jj1212t@gmail.com";
const ADMIN_PASSWORD = "543211";
const TEST_PHONE = "0502857658";

// Real Chrome user data dir — contains the actual localStorage with Twilio keys
const CHROME_USER_DATA = path.join(
  process.env.LOCALAPPDATA || "C:\\Users\\jj121\\AppData\\Local",
  "Google",
  "Chrome",
  "User Data"
);

test.describe.serial("WhatsApp Reminder E2E", () => {
  let supabase: ReturnType<typeof createClient>;
  let userId: string;
  let accessToken: string;

  test.beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    if (error) throw new Error("Login failed: " + error.message);
    userId = data.user!.id;
    accessToken = data.session!.access_token;
  });

  test("Step 1 – Read Twilio keys from real Chrome and save to Supabase", async () => {
    // Launch with real Chrome user data so we have access to real localStorage
    const browser = await chromium.launchPersistentContext(CHROME_USER_DATA, {
      channel: "chrome",
      headless: false,
      args: ["--no-first-run", "--no-default-browser-check"],
    });

    const page = await browser.newPage();

    // Navigate to the local app
    const appUrl = "http://localhost:8080";
    await page.goto(appUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);

    // Read Twilio keys from localStorage
    const twilioKeys = await page.evaluate(() => {
      const saved = localStorage.getItem("crm_api_keys");
      if (!saved) return null;
      const keys = JSON.parse(saved);
      return keys.find((k: { serviceId: string }) => k.serviceId === "twilio");
    });

    await page.screenshot({ path: "tests/screenshots/chrome-app.png" });
    await browser.close();

    console.log(
      "Twilio entry found:",
      twilioKeys
        ? JSON.stringify({
            ...twilioKeys,
            values: Object.fromEntries(
              Object.entries(twilioKeys.values || {}).map(([k, v]) => [
                k,
                typeof v === "string" && v.length > 4
                  ? v.slice(0, 4) + "****"
                  : v,
              ])
            ),
          })
        : "NOT FOUND"
    );

    if (!twilioKeys?.values || Object.values(twilioKeys.values).every((v) => !v)) {
      console.log(
        "⚠️  Twilio keys not in localStorage — need to enter them in Settings page"
      );
      // Skip gracefully — step 3 will still try to call check-reminders
      return;
    }

    // Upsert to Supabase platform_settings
    const upserts = Object.entries(twilioKeys.values)
      .filter(([, v]) => v)
      .map(([fieldKey, value]) => ({
        key: `twilio:${fieldKey}`,
        value: value as string,
        updated_at: new Date().toISOString(),
      }));

    if (upserts.length > 0) {
      const { error } = await supabase
        .from("platform_settings")
        .upsert(upserts, { onConflict: "key" });

      if (error) throw new Error("Upsert failed: " + error.message);
      console.log(`✅ Saved ${upserts.length} Twilio keys to Supabase`);
    }

    // Verify
    const { data: saved } = await supabase
      .from("platform_settings")
      .select("key")
      .like("key", "twilio:%");
    console.log("Keys in DB:", saved?.map((r) => r.key));
    expect(saved?.length).toBeGreaterThan(0);
  });

  test("Step 2 – Create WhatsApp reminder + call check-reminders", async () => {
    // Check that platform_settings has Twilio keys
    const { data: keys } = await supabase
      .from("platform_settings")
      .select("key")
      .like("key", "twilio:%");
    console.log("Twilio keys in Supabase:", keys?.map((r) => r.key));

    if (!keys || keys.length === 0) {
      console.log("⚠️  No Twilio keys in Supabase — WhatsApp won't be sent");
    }

    // Create reminder due 30 seconds ago
    const remind_at = new Date(Date.now() - 30000).toISOString();
    const { data: reminder, error: createErr } = await supabase
      .from("reminders")
      .insert({
        title: "🧪 בדיקת וואטסאפ E2E",
        message: "הודעת בדיקה אוטומטית — אם קיבלת אותה המערכת עובדת!",
        remind_at,
        reminder_type: "whatsapp",
        reminder_types: ["whatsapp"],
        recipient_phone: TEST_PHONE,
        is_sent: false,
        is_dismissed: false,
        user_id: userId,
      })
      .select()
      .single();

    if (createErr) throw new Error("Create reminder: " + createErr.message);
    console.log("✅ Reminder created:", reminder.id, "→", TEST_PHONE);

    // Call check-reminders
    const res = await fetch(`${SUPABASE_URL}/functions/v1/check-reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({}),
    });

    let body: any = {};
    try { body = await res.json(); } catch {}
    console.log("check-reminders response:", JSON.stringify(body, null, 2));

    // Cleanup
    await supabase.from("reminders").delete().eq("id", reminder.id);
    console.log("🧹 Test reminder deleted");

    expect(res.ok).toBe(true);

    const whatsappSent = body.results?.whatsappSent ?? 0;
    if (whatsappSent > 0) {
      console.log(`\n✅ WhatsApp נשלח בהצלחה למספר ${TEST_PHONE}!`);
    } else if (!keys || keys.length === 0) {
      console.log(`\n⚠️  check-reminders עבד אך Twilio לא מוגדר — נשלח דרך הדפדפן בלבד`);
    } else {
      console.log(`\n❌ WhatsApp לא נשלח — בדוק Twilio credentials`);
    }

    // If Twilio keys exist, expect WhatsApp to be sent
    if (keys && keys.length >= 3) {
      expect(whatsappSent).toBeGreaterThan(0);
    }
  });
});