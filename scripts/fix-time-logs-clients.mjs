/**
 * 🔧 סקריפט תיקון שיוך לוגי זמן ללקוחות
 * =============================================
 *
 * הסקריפט מתקן את הבעיה שלוגי זמן לא משויכים ללקוחות אחרי שחזור/ייבוא.
 *
 * מה הוא עושה:
 * 1. טוען את קובץ הגיבוי (JSON) עם client_name לכל לוג
 * 2. טוען את כל הלקוחות מ-Supabase
 * 3. טוען את כל לוגי הזמן ללא client_id
 * 4. מתאים כל לוג ללקוח לפי תאריך+תיאור → client_name
 * 5. מעדכן את ה-client_id בכל הלוגים שנמצא להם התאמה
 *
 * שימוש:
 *   node scripts/fix-time-logs-clients.mjs
 *   node scripts/fix-time-logs-clients.mjs --dry-run    (ריצת ניסיון - לא משנה נתונים)
 *   node scripts/fix-time-logs-clients.mjs --all        (מתקן גם לוגים שכבר משויכים)
 *   node scripts/fix-time-logs-clients.mjs --backup path/to/backup.json
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ========== הגדרות ==========
const SUPABASE_URL = "https://eadeymehidcndudeycnf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;

// פרטי התחברות (נדרש כדי לעבור RLS)
const AUTH_EMAIL = process.env.SUPABASE_EMAIL || "jj1212t@gmail.com";
const AUTH_PASSWORD = process.env.SUPABASE_PASSWORD || "543211";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// התחברות למערכת
async function authenticate() {
  console.log("🔐 מתחבר למערכת...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: AUTH_EMAIL,
    password: AUTH_PASSWORD,
  });
  if (error) {
    console.error("❌ שגיאת התחברות:", error.message);
    process.exit(1);
  }
  console.log(`   ✓ מחובר כ: ${data.user.email}`);
  return data.user;
}

// ========== ניתוח פרמטרים ==========
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FIX_ALL = args.includes("--all");
const backupArgIndex = args.indexOf("--backup");
const BACKUP_FILE =
  backupArgIndex !== -1 && args[backupArgIndex + 1]
    ? args[backupArgIndex + 1]
    : null;

// חיפוש אוטומטי של קובץ גיבוי
function findBackupFile() {
  if (BACKUP_FILE) {
    if (fs.existsSync(BACKUP_FILE)) return BACKUP_FILE;
    const fullPath = path.join(__dirname, "..", BACKUP_FILE);
    if (fs.existsSync(fullPath)) return fullPath;
    console.error(`❌ קובץ גיבוי לא נמצא: ${BACKUP_FILE}`);
    process.exit(1);
  }

  // חיפוש אוטומטי לפי סדר עדיפות
  const candidates = [
    "backup_to_import.json",
    "backup_2026-01-27 (1).json",
    "backup_2026-01-27.json",
    "backup-2026-01-20 (2).json",
  ];

  for (const candidate of candidates) {
    const fullPath = path.join(__dirname, "..", candidate);
    if (fs.existsSync(fullPath)) {
      console.log(`📂 נמצא קובץ גיבוי: ${candidate}`);
      return fullPath;
    }
  }

  // חיפוש כללי של קבצי JSON עם "backup" בשם
  const rootDir = path.join(__dirname, "..");
  const files = fs
    .readdirSync(rootDir)
    .filter((f) => f.endsWith(".json") && f.toLowerCase().includes("backup"));

  if (files.length > 0) {
    const chosen = files.sort().reverse()[0]; // הכי חדש
    console.log(`📂 נמצא קובץ גיבוי: ${chosen}`);
    return path.join(rootDir, chosen);
  }

  console.error("❌ לא נמצא קובץ גיבוי. השתמש ב: --backup <path>");
  process.exit(1);
}

// ========== פונקציות עזר ==========

function printHeader() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║  🔧 תיקון שיוך לוגי זמן ללקוחות                ║");
  console.log("╚══════════════════════════════════════════════════╝");
  console.log("");
  if (DRY_RUN) {
    console.log("⚠️  מצב DRY RUN - לא ישתנו נתונים!");
    console.log("");
  }
  if (FIX_ALL) {
    console.log("🔄 מצב FIX ALL - מתקן גם לוגים שכבר משויכים");
    console.log("");
  }
}

function normalizeString(str) {
  if (!str) return "";
  return str.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")} שעות`;
  return `${minutes} דקות`;
}

// ========== שלב 1: טעינת גיבוי ==========

function loadBackup(filePath) {
  console.log("📂 שלב 1: טוען קובץ גיבוי...");

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // תמיכה בפורמטים שונים
  const timeLogs =
    raw.data?.TimeLog ||
    raw.data?.timeLogs ||
    raw.TimeLog ||
    raw.timeLogs ||
    [];
  const clients =
    raw.data?.Client || raw.data?.clients || raw.Client || raw.clients || [];

  console.log(`   📊 לוגי זמן בגיבוי: ${timeLogs.length}`);
  console.log(`   📊 לקוחות בגיבוי: ${clients.length}`);

  if (timeLogs.length === 0) {
    console.error("❌ לא נמצאו לוגי זמן בקובץ הגיבוי!");
    process.exit(1);
  }

  return { timeLogs, clients };
}

// ========== שלב 2: טעינת נתונים מ-Supabase ==========

async function loadSupabaseData() {
  console.log("\n🌐 שלב 2: טוען נתונים מ-Supabase...");

  // טעינת לקוחות
  const { data: dbClients, error: clientsError } = await supabase
    .from("clients")
    .select("id, name");

  if (clientsError) {
    console.error("❌ שגיאה בטעינת לקוחות:", clientsError.message);
    process.exit(1);
  }

  console.log(`   👥 לקוחות ב-DB: ${dbClients.length}`);

  // טעינת לוגי זמן
  let query = supabase
    .from("time_entries")
    .select(
      "id, client_id, description, start_time, duration_minutes, custom_data",
    )
    .order("start_time", { ascending: false });

  if (!FIX_ALL) {
    query = query.is("client_id", null);
  }

  const { data: timeEntries, error: entriesError } = await query;

  if (entriesError) {
    console.error("❌ שגיאה בטעינת לוגי זמן:", entriesError.message);
    process.exit(1);
  }

  const unlinked = timeEntries.filter((e) => !e.client_id);
  const linked = timeEntries.filter((e) => e.client_id);

  console.log(
    `   ⏱️  לוגי זמן ${FIX_ALL ? 'סה"כ' : "ללא לקוח"}: ${timeEntries.length}`,
  );
  if (FIX_ALL) {
    console.log(`      - ללא לקוח: ${unlinked.length}`);
    console.log(`      - עם לקוח: ${linked.length}`);
  }

  return { dbClients, timeEntries };
}

// ========== שלב 3: בניית מפות חיפוש ==========

function buildLookupMaps(backupTimeLogs, dbClients) {
  console.log("\n🗺️  שלב 3: בונה מפות חיפוש...");

  // מפת שם לקוח → ID ב-Supabase
  const clientNameToId = new Map();
  for (const client of dbClients) {
    if (client.name) {
      clientNameToId.set(normalizeString(client.name), client.id);
    }
  }
  console.log(`   📌 מפת שמות לקוחות: ${clientNameToId.size} רשומות`);

  // מפת (תאריך + תיאור) → שם לקוח (מהגיבוי)
  const dateDescToClientName = new Map();
  const dateDescToBackupLog = new Map();

  for (const log of backupTimeLogs) {
    if (!log.client_name) continue;

    const logDate = new Date(log.log_date);
    logDate.setHours(9, 0, 0, 0);
    const dateStr = logDate.toISOString().substring(0, 10);

    const description =
      [log.title, log.notes].filter(Boolean).join(" - ") || "";

    // מפתח מלא: תאריך + תיאור מלא
    const fullKey = `${dateStr}|${description}`;
    dateDescToClientName.set(fullKey, log.client_name);
    dateDescToBackupLog.set(fullKey, log);

    // מפתח חלקי: תאריך + כותרת בלבד
    if (log.title) {
      const titleKey = `${dateStr}|${log.title}`;
      if (!dateDescToClientName.has(titleKey)) {
        dateDescToClientName.set(titleKey, log.client_name);
        dateDescToBackupLog.set(titleKey, log);
      }
    }

    // מפתח חלקי: תאריך + הערות בלבד
    if (log.notes && !log.title) {
      const notesKey = `${dateStr}|${log.notes}`;
      if (!dateDescToClientName.has(notesKey)) {
        dateDescToClientName.set(notesKey, log.client_name);
        dateDescToBackupLog.set(notesKey, log);
      }
    }

    // מפתח תאריך בלבד (יקח רק את הראשון)
    if (!dateDescToClientName.has(`${dateStr}|__DATEONLY__`)) {
      // רק אם יש לוג יחיד לתאריך - לא שימושי אם יש כמה
    }
  }

  console.log(
    `   📌 מפת תאריך+תיאור → שם לקוח: ${dateDescToClientName.size} רשומות`,
  );

  return { clientNameToId, dateDescToClientName, dateDescToBackupLog };
}

// ========== שלב 4: התאמה ותיקון ==========

async function fixEntries(timeEntries, lookupMaps, dbClients) {
  console.log("\n🔧 שלב 4: מתאים ומתקן לוגים...");

  const { clientNameToId, dateDescToClientName } = lookupMaps;

  let fixed = 0;
  let alreadyCorrect = 0;
  let notFound = 0;
  let errors = 0;

  const unmatchedEntries = [];
  const matchedEntries = [];
  const batchUpdates = [];

  for (let i = 0; i < timeEntries.length; i++) {
    const entry = timeEntries[i];
    const dateStr = entry.start_time?.substring(0, 10) || "";
    const desc = entry.description?.trim() || "";

    let matchedClientId = null;
    let matchMethod = "";

    // === שיטה 1: שם לקוח מ-custom_data (ייבוא ישן) ===
    if (!matchedClientId && entry.custom_data?.original_client_name) {
      const origName = normalizeString(entry.custom_data.original_client_name);
      matchedClientId = clientNameToId.get(origName);
      if (matchedClientId) matchMethod = "custom-data";
    }

    // === שיטה 2: התאמה מלאה מהגיבוי (תאריך + תיאור מלא) ===
    if (!matchedClientId) {
      const fullKey = `${dateStr}|${desc}`;
      const clientNameFromBackup = dateDescToClientName.get(fullKey);
      if (clientNameFromBackup) {
        matchedClientId = clientNameToId.get(
          normalizeString(clientNameFromBackup),
        );
        if (matchedClientId) matchMethod = "full-match";
      }
    }

    // === שיטה 3: התאמה לפי כותרת בלבד ===
    if (!matchedClientId && desc) {
      const descParts = desc.split(" - ");
      for (const part of descParts) {
        const partKey = `${dateStr}|${part.trim()}`;
        const partialClientName = dateDescToClientName.get(partKey);
        if (partialClientName) {
          matchedClientId = clientNameToId.get(
            normalizeString(partialClientName),
          );
          if (matchedClientId) {
            matchMethod = "partial-match";
            break;
          }
        }
      }
    }

    // === שיטה 4: שם לקוח בתוך התיאור ===
    if (!matchedClientId && desc) {
      const descLower = desc.toLowerCase();
      for (const client of dbClients) {
        const normalizedName = normalizeString(client.name);
        if (
          normalizedName.length > 3 &&
          (descLower === normalizedName ||
            descLower.startsWith(normalizedName + " -") ||
            descLower.startsWith(normalizedName + " ") ||
            descLower.includes(" - " + normalizedName))
        ) {
          matchedClientId = client.id;
          matchMethod = "name-in-desc";
          break;
        }
      }
    }

    // === שיטה 5: fuzzy match - חיפוש דומה בתאריך ===
    if (!matchedClientId) {
      // חפש את כל הלוגים בגיבוי מאותו תאריך
      for (const [key, clientName] of dateDescToClientName) {
        if (key.startsWith(dateStr + "|")) {
          const backupDesc = key.split("|")[1];
          // אם התיאור דומה (75% התאמה)
          if (desc && backupDesc && isSimilar(desc, backupDesc, 0.6)) {
            matchedClientId = clientNameToId.get(normalizeString(clientName));
            if (matchedClientId) {
              matchMethod = "fuzzy-match";
              break;
            }
          }
        }
      }
    }

    // === תוצאה ===
    if (matchedClientId) {
      if (entry.client_id === matchedClientId) {
        alreadyCorrect++;
        continue;
      }

      matchedEntries.push({
        id: entry.id,
        client_id: matchedClientId,
        method: matchMethod,
        desc: desc.substring(0, 40),
        date: dateStr,
      });

      batchUpdates.push({ id: entry.id, client_id: matchedClientId });
    } else {
      notFound++;
      unmatchedEntries.push({
        id: entry.id,
        desc: desc.substring(0, 50),
        date: dateStr,
      });
    }

    // הדפסת התקדמות
    if ((i + 1) % 100 === 0) {
      process.stdout.write(`   ... עיבוד ${i + 1}/${timeEntries.length}\r`);
    }
  }

  console.log(`   ✅ נמצאו ${matchedEntries.length} התאמות`);
  console.log(`   ⏭️  כבר משויכים נכון: ${alreadyCorrect}`);
  console.log(`   ❌ לא נמצאה התאמה: ${notFound}`);

  // הדפסת פירוט שיטות התאמה
  const methodCounts = {};
  matchedEntries.forEach((e) => {
    methodCounts[e.method] = (methodCounts[e.method] || 0) + 1;
  });
  if (Object.keys(methodCounts).length > 0) {
    console.log("\n   📊 שיטות התאמה:");
    for (const [method, count] of Object.entries(methodCounts)) {
      const methodNames = {
        "custom-data": "שם לקוח מנתוני ייבוא (custom_data)",
        "full-match": "התאמה מלאה (תאריך+תיאור)",
        "partial-match": "התאמה חלקית (כותרת)",
        "name-in-desc": "שם לקוח בתיאור",
        "fuzzy-match": "התאמה מעורפלת",
      };
      console.log(`      ${methodNames[method] || method}: ${count}`);
    }
  }

  // הדפסת דוגמאות של לוגים ללא התאמה
  if (unmatchedEntries.length > 0 && unmatchedEntries.length <= 20) {
    console.log("\n   ❌ לוגים ללא התאמה:");
    unmatchedEntries.forEach((e, i) => {
      console.log(`      ${i + 1}. [${e.date}] ${e.desc || "(ללא תיאור)"}`);
    });
  } else if (unmatchedEntries.length > 20) {
    console.log(
      `\n   ❌ לוגים ללא התאמה (מציג 20 מתוך ${unmatchedEntries.length}):`,
    );
    unmatchedEntries.slice(0, 20).forEach((e, i) => {
      console.log(`      ${i + 1}. [${e.date}] ${e.desc || "(ללא תיאור)"}`);
    });
  }

  // === ביצוע העדכון ===
  if (batchUpdates.length === 0) {
    console.log("\n✨ אין מה לתקן!");
    return { fixed: 0, notFound, alreadyCorrect, errors: 0 };
  }

  if (DRY_RUN) {
    console.log(`\n🔍 DRY RUN - היה מעדכן ${batchUpdates.length} רשומות`);
    console.log("\n📋 דוגמאות לעדכונים:");
    batchUpdates.slice(0, 10).forEach((u, i) => {
      const match = matchedEntries.find((m) => m.id === u.id);
      console.log(
        `   ${i + 1}. [${match?.date}] "${match?.desc}" → לקוח (${match?.method})`,
      );
    });
    return {
      fixed: 0,
      notFound,
      alreadyCorrect,
      errors: 0,
      wouldFix: batchUpdates.length,
    };
  }

  console.log(`\n🔄 מעדכן ${batchUpdates.length} רשומות...`);

  // עדכון בקבוצות של 20
  const BATCH_SIZE = 20;
  for (let i = 0; i < batchUpdates.length; i += BATCH_SIZE) {
    const batch = batchUpdates.slice(i, i + BATCH_SIZE);

    for (const update of batch) {
      const { error } = await supabase
        .from("time_entries")
        .update({ client_id: update.client_id })
        .eq("id", update.id);

      if (error) {
        console.error(`   ❌ שגיאה בעדכון ${update.id}:`, error.message);
        errors++;
      } else {
        fixed++;
      }
    }

    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= batchUpdates.length) {
      console.log(
        `   ... עודכנו ${Math.min(i + BATCH_SIZE, batchUpdates.length)}/${batchUpdates.length}`,
      );
    }
  }

  return { fixed, notFound, alreadyCorrect, errors };
}

// השוואה מעורפלת - Dice coefficient
function isSimilar(str1, str2, threshold) {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return true;
  if (!s1 || !s2) return false;

  // Bigram similarity
  const bigrams1 = new Set();
  for (let i = 0; i < s1.length - 1; i++) {
    bigrams1.add(s1.substring(i, i + 2));
  }

  const bigrams2 = new Set();
  for (let i = 0; i < s2.length - 1; i++) {
    bigrams2.add(s2.substring(i, i + 2));
  }

  let intersection = 0;
  for (const b of bigrams1) {
    if (bigrams2.has(b)) intersection++;
  }

  const similarity = (2 * intersection) / (bigrams1.size + bigrams2.size);
  return similarity >= threshold;
}

// ========== שלב 5: אימות ==========

async function verify() {
  console.log("\n🔍 שלב 5: אימות תוצאות...");

  const { data: totalEntries } = await supabase
    .from("time_entries")
    .select("id", { count: "exact", head: true });

  const { data: linkedEntries } = await supabase
    .from("time_entries")
    .select("id", { count: "exact", head: true })
    .not("client_id", "is", null);

  const { data: unlinkedEntries } = await supabase
    .from("time_entries")
    .select("id", { count: "exact", head: true })
    .is("client_id", null);

  // Supabase returns count in a weird way with head:true
  const { count: total } = await supabase
    .from("time_entries")
    .select("*", { count: "exact", head: true });

  const { count: linked } = await supabase
    .from("time_entries")
    .select("*", { count: "exact", head: true })
    .not("client_id", "is", null);

  const { count: unlinked } = await supabase
    .from("time_entries")
    .select("*", { count: "exact", head: true })
    .is("client_id", null);

  console.log(`   📊 סה"כ רשומות זמן: ${total}`);
  console.log(`   ✅ משויכים ללקוח: ${linked}`);
  console.log(`   ❌ ללא לקוח: ${unlinked}`);

  if (total > 0) {
    const pct = ((linked / total) * 100).toFixed(1);
    console.log(`   📈 אחוז שיוך: ${pct}%`);
  }

  return { total, linked, unlinked };
}

// ========== Main ==========

async function main() {
  printHeader();

  try {
    // התחברות
    await authenticate();

    // שלב 1: טעינת גיבוי
    const backupPath = findBackupFile();
    const backup = loadBackup(backupPath);

    // שלב 2: טעינת נתונים
    const { dbClients, timeEntries } = await loadSupabaseData();

    if (timeEntries.length === 0) {
      console.log("\n✨ כל לוגי הזמן כבר משויכים ללקוחות!");
      await verify();
      return;
    }

    // שלב 3: בניית מפות
    const lookupMaps = buildLookupMaps(backup.timeLogs, dbClients);

    // שלב 4: התאמה ותיקון
    const results = await fixEntries(timeEntries, lookupMaps, dbClients);

    // שלב 5: אימות
    if (!DRY_RUN) {
      await verify();
    }

    // סיכום
    console.log("\n" + "═".repeat(50));
    console.log("📊 סיכום:");
    if (DRY_RUN) {
      console.log(`   🔍 היה מתקן: ${results.wouldFix || 0} רשומות`);
      console.log(`   ⏭️  כבר משויכים: ${results.alreadyCorrect}`);
      console.log(`   ❌ לא נמצאה התאמה: ${results.notFound}`);
      console.log("\n   💡 הרץ בלי --dry-run כדי לבצע בפועל");
    } else {
      console.log(`   ✅ תוקנו: ${results.fixed} רשומות`);
      console.log(`   ⏭️  כבר משויכים: ${results.alreadyCorrect}`);
      console.log(`   ❌ לא נמצאה התאמה: ${results.notFound}`);
      console.log(`   ⚠️  שגיאות: ${results.errors}`);
    }
    console.log("═".repeat(50));
    console.log("\n✅ הסקריפט הושלם!");
  } catch (err) {
    console.error("\n❌ שגיאה:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
