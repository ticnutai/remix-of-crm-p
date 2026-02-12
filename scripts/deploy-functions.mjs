/**
 * 🚀 Edge Functions Deploy Script
 * ================================
 * מעלה את כל ה-Edge Functions ל-Supabase בפקודה אחת
 *
 * שימוש:
 *   node scripts/deploy-functions.mjs              ← כל הפונקציות
 *   node scripts/deploy-functions.mjs auto-backup   ← פונקציה אחת ספציפית
 *   node scripts/deploy-functions.mjs list          ← רשימת כל הפונקציות
 */

import { execSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const PROJECT_REF = "eadeymehidcndudeycnf";

// ====================================
// 🎨 עיצוב
// ====================================
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function header() {
  console.log(`
${CYAN}══════════════════════════════════════════════════${RESET}
   ${BOLD}🚀 Edge Functions Deploy${RESET}
${CYAN}══════════════════════════════════════════════════${RESET}`);
}

function success(msg) {
  console.log(`${GREEN}✅ ${msg}${RESET}`);
}
function error(msg) {
  console.log(`${RED}❌ ${msg}${RESET}`);
}
function info(msg) {
  console.log(`${BLUE}ℹ️  ${msg}${RESET}`);
}
function warn(msg) {
  console.log(`${YELLOW}⚠️  ${msg}${RESET}`);
}

// ====================================
// 🔍 מציאת כל הפונקציות
// ====================================
function getAllFunctions() {
  const functionsDir = path.join(ROOT, "supabase", "functions");
  if (!fs.existsSync(functionsDir)) {
    error("תיקיית supabase/functions לא נמצאה!");
    process.exit(1);
  }

  return fs
    .readdirSync(functionsDir)
    .filter((name) => {
      const dir = path.join(functionsDir, name);
      return (
        fs.statSync(dir).isDirectory() &&
        fs.existsSync(path.join(dir, "index.ts"))
      );
    })
    .sort();
}

// ====================================
// 🔐 בדיקת חיבור ל-Supabase CLI
// ====================================
function checkLogin() {
  try {
    // Try a simple command to verify authentication
    const result = spawnSync("supabase", ["projects", "list"], {
      encoding: "utf-8",
      timeout: 15000,
    });

    if (result.status === 0) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function checkCLI() {
  try {
    const result = spawnSync("supabase", ["--version"], { encoding: "utf-8" });
    if (result.status === 0) {
      return result.stdout.trim();
    }
    return null;
  } catch {
    return null;
  }
}

// ====================================
// 🚀 Deploy פונקציה אחת
// ====================================
function deployFunction(name) {
  process.stdout.write(`  🔄 ${name.padEnd(30)}`);

  try {
    const result = spawnSync(
      "supabase",
      [
        "functions",
        "deploy",
        name,
        "--project-ref",
        PROJECT_REF,
        "--no-verify-jwt",
      ],
      {
        encoding: "utf-8",
        timeout: 60000,
        cwd: ROOT,
      },
    );

    if (result.status === 0) {
      console.log(`${GREEN}✅ OK${RESET}`);
      return true;
    } else {
      const errMsg = (result.stderr || result.stdout || "")
        .trim()
        .split("\n")[0];
      console.log(`${RED}❌ ${errMsg}${RESET}`);
      return false;
    }
  } catch (e) {
    console.log(`${RED}❌ ${e.message}${RESET}`);
    return false;
  }
}

// ====================================
// 🎬 Main
// ====================================
async function main() {
  header();

  const arg = process.argv[2];

  // בדיקת Supabase CLI
  const cliVersion = checkCLI();
  if (!cliVersion) {
    error("Supabase CLI לא מותקן!");
    info("התקן עם: npm install -g supabase");
    process.exit(1);
  }
  info(`Supabase CLI v${cliVersion}`);

  // רשימת כל הפונקציות
  const allFunctions = getAllFunctions();

  // פקודת list
  if (arg === "list") {
    console.log(`\n📋 ${BOLD}${allFunctions.length} פונקציות נמצאו:${RESET}\n`);
    allFunctions.forEach((fn, i) => {
      console.log(`  ${String(i + 1).padStart(2)}. ${fn}`);
    });
    console.log("");
    return;
  }

  // בדיקת חיבור
  info("בודק חיבור ל-Supabase...");
  const loggedIn = checkLogin();

  if (!loggedIn) {
    warn("לא מחובר ל-Supabase CLI!");
    console.log("");
    console.log(`${BOLD}  הריצו קודם:${RESET}`);
    console.log(`${CYAN}  supabase login${RESET}`);
    console.log("");
    console.log("  (ייפתח דפדפן → התחבר → חזור לפה)");
    console.log("");
    process.exit(1);
  }
  success("מחובר ל-Supabase!");

  // Deploy
  const toDeploy = arg ? [arg] : allFunctions;

  // בדוק שהפונקציה קיימת
  if (arg && arg !== "list" && !allFunctions.includes(arg)) {
    error(`פונקציה "${arg}" לא נמצאה!`);
    info(`פונקציות זמינות: ${allFunctions.join(", ")}`);
    process.exit(1);
  }

  console.log(`\n${BOLD}📦 מעלה ${toDeploy.length} פונקציות...${RESET}\n`);

  let ok = 0;
  let fail = 0;

  for (const fn of toDeploy) {
    const result = deployFunction(fn);
    if (result) ok++;
    else fail++;
  }

  // סיכום
  console.log(`\n${"─".repeat(50)}`);
  console.log(`${BOLD}📊 סיכום:${RESET}`);
  if (ok > 0) success(`${ok} פונקציות הועלו בהצלחה`);
  if (fail > 0) error(`${fail} פונקציות נכשלו`);
  console.log(`\n${CYAN}🏁 Done!${RESET}\n`);
}

main().catch((e) => {
  error(`Fatal: ${e.message}`);
  process.exit(1);
});
