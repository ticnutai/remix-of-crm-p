/**
 * 🚀 Edge Functions Deploy via Edge Function
 * ============================================
 * מעלה Edge Functions דרך ה-deploy-function Edge Function
 * (בלי צורך ב-Supabase CLI login!)
 *
 * שימוש:
 *   node scripts/deploy-via-edge.mjs                  ← כל הפונקציות
 *   node scripts/deploy-via-edge.mjs auto-backup      ← פונקציה אחת
 *   node scripts/deploy-via-edge.mjs list             ← רשימת פונקציות בענן
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

// Supabase config
const SUPABASE_URL = "https://eadeymehidcndudeycnf.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";
const ADMIN_EMAIL = "jj1212t@gmail.com";
const ADMIN_PASSWORD = "543211";

// Colors
const G = "\x1b[32m",
  R = "\x1b[31m",
  Y = "\x1b[33m",
  B = "\x1b[34m",
  C = "\x1b[36m",
  BOLD = "\x1b[1m",
  X = "\x1b[0m";

function header() {
  console.log(`
${C}══════════════════════════════════════════════════${X}
   ${BOLD}🚀 Edge Functions Deploy (via Edge Function)${X}
${C}══════════════════════════════════════════════════${X}`);
}

// Get all local functions
function getLocalFunctions() {
  const dir = path.join(ROOT, "supabase", "functions");
  return fs
    .readdirSync(dir)
    .filter((name) => {
      const d = path.join(dir, name);
      return (
        fs.statSync(d).isDirectory() && fs.existsSync(path.join(d, "index.ts"))
      );
    })
    .sort();
}

// Call the deploy-function Edge Function
async function callDeployFunction(token, action, functionName, functionCode) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/deploy-function`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${token}`,
      "x-client-info": "ncrm-deploy",
    },
    body: JSON.stringify({
      action,
      function_name: functionName,
      function_code: functionCode,
    }),
  });

  const data = await resp.json();
  return { status: resp.status, data };
}

async function main() {
  header();
  const arg = process.argv[2];

  // Login
  console.log(`${B}🔐 מתחבר...${X}`);
  const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { error: authErr } = await sb.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authErr) {
    console.log(`${R}❌ Login failed: ${authErr.message}${X}`);
    process.exit(1);
  }
  const {
    data: { session },
  } = await sb.auth.getSession();
  console.log(`${G}✅ מחובר כ: ${ADMIN_EMAIL}${X}`);

  // List cloud functions
  if (arg === "list") {
    console.log(`\n${BOLD}📋 פונקציות בענן:${X}\n`);
    const { status, data } = await callDeployFunction(
      session.access_token,
      "list",
    );
    if (data.success && data.functions) {
      data.functions.forEach((fn, i) => {
        const status =
          fn.status === "ACTIVE" ? `${G}ACTIVE${X}` : `${Y}${fn.status}${X}`;
        console.log(
          `  ${String(i + 1).padStart(2)}. ${fn.slug?.padEnd(30) || fn.name?.padEnd(30)} ${status}`,
        );
      });
    } else {
      console.log(`${R}❌ ${data.error || "Unknown error"}${X}`);
      if (data.error?.includes("MANAGEMENT_TOKEN")) {
        console.log(`\n${Y}⚠️  צריך להגדיר token!${X}`);
        console.log(
          `  1. צור token ב: https://supabase.com/dashboard/account/tokens`,
        );
        console.log(
          `  2. הגדר ב-Supabase Dashboard → Edge Functions → Secrets:`,
        );
        console.log(`     Key: SUPABASE_MANAGEMENT_TOKEN`);
        console.log(`     Value: sbp_xxxxxxxxxxxx`);
      }
    }
    return;
  }

  // Get functions to deploy
  const allFunctions = getLocalFunctions();
  const toDeploy = arg ? [arg] : allFunctions;

  // Validate
  if (arg && !allFunctions.includes(arg)) {
    console.log(`${R}❌ פונקציה "${arg}" לא נמצאה מקומית${X}`);
    console.log(`  פונקציות זמינות: ${allFunctions.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}📦 מעלה ${toDeploy.length} פונקציות...${X}\n`);

  let ok = 0,
    fail = 0;

  for (const fn of toDeploy) {
    process.stdout.write(`  🔄 ${fn.padEnd(30)} `);

    // Read function code
    const codePath = path.join(ROOT, "supabase", "functions", fn, "index.ts");
    const code = fs.readFileSync(codePath, "utf-8");

    // Deploy
    const { status, data } = await callDeployFunction(
      session.access_token,
      "deploy",
      fn,
      code,
    );

    if (data.success) {
      console.log(`${G}✅ ${data.action || "OK"}${X}`);
      ok++;
    } else {
      console.log(`${R}❌ ${data.error}${X}`);
      fail++;
    }
  }

  // Summary
  console.log(`\n${"─".repeat(50)}`);
  console.log(`${BOLD}📊 סיכום:${X}`);
  if (ok > 0) console.log(`${G}✅ ${ok} פונקציות הועלו בהצלחה${X}`);
  if (fail > 0) console.log(`${R}❌ ${fail} פונקציות נכשלו${X}`);
  console.log(`\n${C}🏁 Done!${X}\n`);
}

main().catch((e) => {
  console.log(`${R}❌ Fatal: ${e.message}${X}`);
  process.exit(1);
});
