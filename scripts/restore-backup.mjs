/**
 * שחזור נתונים מגיבוי ענן (3/2/2026)
 * backup id: 0d504604-b3c0-480c-af38-75f2c1bc9843
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eadeymehidcndudeycnf.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGV5bWVoaWRjbmR1ZGV5Y25mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4Mzg2ODQsImV4cCI6MjA4NDQxNDY4NH0.8t74NyPPHaWXHGyllAvdjPZ6DfAWM9fsAKopVEVogpM";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const BACKUP_ID = "0d504604-b3c0-480c-af38-75f2c1bc9843";

async function main() {
  console.log("🚀 מתחיל שחזור מגיבוי 3/2/2026...\n");

  // 1. Login
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: "jj1212t@gmail.com",
    password: "543211",
  });
  if (authErr) {
    console.error("❌ Auth error:", authErr.message);
    process.exit(1);
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("✅ מחובר כ:", user.email, "| id:", user.id);

  // 2. Load backup
  console.log("\n📂 טוען גיבוי...");
  const { data: backupRow, error: bErr } = await supabase
    .from("backups")
    .select("data,name,created_at")
    .eq("id", BACKUP_ID)
    .single();
  if (bErr) {
    console.error("❌ Backup load error:", bErr.message);
    process.exit(1);
  }
  const backup = backupRow.data;
  console.log(`✅ גיבוי "${backupRow.name}" מתאריך ${backupRow.created_at}`);
  console.log(
    `   לקוחות: ${backup.clients?.length || 0}, stages: ${backup.client_stages?.length || 0}, tasks: ${backup.client_stage_tasks?.length || 0}`,
  );

  // 3. Delete the single garbage client that exists
  console.log("\n🗑️ מוחק לקוח זבל קיים...");
  const { error: delErr } = await supabase
    .from("clients")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) console.log("   ⚠️ Delete error:", delErr.message);
  else console.log("   ✅ נוקה");

  // 4. Restore clients (in batches of 20)
  console.log("\n👥 משחזר לקוחות...");
  let clientOk = 0,
    clientErr = 0;
  const clients = backup.clients || [];
  for (let i = 0; i < clients.length; i += 20) {
    const batch = clients.slice(i, i + 20).map((c) => ({
      ...c,
      // Ensure user_id is set
      user_id: c.user_id || user.id,
    }));
    const { error } = await supabase
      .from("clients")
      .upsert(batch, { onConflict: "id" });
    if (error) {
      console.error(`   ❌ Batch ${i}: ${error.message}`);
      // Try one by one
      for (const c of batch) {
        const { error: e2 } = await supabase
          .from("clients")
          .upsert(c, { onConflict: "id" });
        if (e2) {
          console.error(`   ❌ "${c.name}": ${e2.message}`);
          clientErr++;
        } else clientOk++;
      }
    } else {
      clientOk += batch.length;
    }
    if ((i + 20) % 60 === 0 && i > 0) console.log(`   ... ${clientOk} לקוחות`);
  }
  console.log(`   ✅ ${clientOk} לקוחות שוחזרו (${clientErr} שגיאות)`);

  // 5. Restore stage_templates
  console.log("\n📋 משחזר תבניות שלבים...");
  const templates = backup.stage_templates || [];
  if (templates.length > 0) {
    // Delete existing first to avoid conflicts
    await supabase
      .from("stage_template_tasks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("stage_template_stages")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("stage_templates")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    for (const t of templates) {
      const { error } = await supabase
        .from("stage_templates")
        .upsert({ ...t, user_id: t.user_id || user.id }, { onConflict: "id" });
      if (error) console.error(`   ❌ Template: ${error.message}`);
    }
    console.log(`   ✅ ${templates.length} תבניות`);
  }

  // 6. Restore stage_template_stages
  const tStages = backup.stage_template_stages || [];
  if (tStages.length > 0) {
    for (let i = 0; i < tStages.length; i += 20) {
      const batch = tStages.slice(i, i + 20);
      const { error } = await supabase
        .from("stage_template_stages")
        .upsert(batch, { onConflict: "id" });
      if (error) console.error(`   ❌ Template stages batch: ${error.message}`);
    }
    console.log(`   ✅ ${tStages.length} שלבי תבנית`);
  }

  // 7. Restore stage_template_tasks
  const tTasks = backup.stage_template_tasks || [];
  if (tTasks.length > 0) {
    for (let i = 0; i < tTasks.length; i += 20) {
      const batch = tTasks.slice(i, i + 20);
      const { error } = await supabase
        .from("stage_template_tasks")
        .upsert(batch, { onConflict: "id" });
      if (error) console.error(`   ❌ Template tasks batch: ${error.message}`);
    }
    console.log(`   ✅ ${tTasks.length} משימות תבנית`);
  }

  // 8. Restore client_stages (delete existing first)
  console.log("\n📊 משחזר שלבי לקוחות...");
  const stages = backup.client_stages || [];
  if (stages.length > 0) {
    await supabase
      .from("client_stage_tasks")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase
      .from("client_stages")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    let stageOk = 0,
      stageErr2 = 0;
    for (let i = 0; i < stages.length; i += 20) {
      const batch = stages.slice(i, i + 20);
      const { error } = await supabase
        .from("client_stages")
        .upsert(batch, { onConflict: "id" });
      if (error) {
        for (const s of batch) {
          const { error: e2 } = await supabase
            .from("client_stages")
            .upsert(s, { onConflict: "id" });
          if (e2) {
            console.error(`   ❌ Stage: ${e2.message}`);
            stageErr2++;
          } else stageOk++;
        }
      } else stageOk += batch.length;
    }
    console.log(`   ✅ ${stageOk} שלבים (${stageErr2} שגיאות)`);
  }

  // 9. Restore client_stage_tasks
  const stageTasks = backup.client_stage_tasks || [];
  if (stageTasks.length > 0) {
    let taskOk = 0,
      taskErr2 = 0;
    for (let i = 0; i < stageTasks.length; i += 20) {
      const batch = stageTasks.slice(i, i + 20);
      const { error } = await supabase
        .from("client_stage_tasks")
        .upsert(batch, { onConflict: "id" });
      if (error) {
        for (const t of batch) {
          const { error: e2 } = await supabase
            .from("client_stage_tasks")
            .upsert(t, { onConflict: "id" });
          if (e2) {
            console.error(`   ❌ Task: ${e2.message}`);
            taskErr2++;
          } else taskOk++;
        }
      } else taskOk += batch.length;
    }
    console.log(`   ✅ ${taskOk} משימות שלב (${taskErr2} שגיאות)`);
  }

  // 10. Restore meetings
  console.log("\n📅 משחזר פגישות...");
  const meetings = backup.meetings || [];
  if (meetings.length > 0) {
    for (const m of meetings) {
      const { error } = await supabase
        .from("meetings")
        .upsert({ ...m, user_id: m.user_id || user.id }, { onConflict: "id" });
      if (error) console.error(`   ❌ Meeting: ${error.message}`);
    }
    console.log(`   ✅ ${meetings.length} פגישות`);
  }

  // 11. Restore custom_tables
  console.log("\n📊 משחזר טבלאות מותאמות...");
  const customTables = backup.custom_tables || [];
  if (customTables.length > 0) {
    for (const ct of customTables) {
      const { error } = await supabase
        .from("custom_tables")
        .upsert(
          { ...ct, user_id: ct.user_id || user.id },
          { onConflict: "id" },
        );
      if (error) console.error(`   ❌ Custom table: ${error.message}`);
    }
    console.log(`   ✅ ${customTables.length} טבלאות`);
  }

  // 12. Final verification
  console.log("\n" + "=".repeat(50));
  console.log("🔍 בדיקת שחזור:");
  const tables = [
    "clients",
    "client_stages",
    "client_stage_tasks",
    "stage_templates",
    "stage_template_stages",
    "stage_template_tasks",
    "meetings",
    "time_entries",
    "custom_tables",
  ];
  for (const t of tables) {
    const { count } = await supabase
      .from(t)
      .select("*", { count: "exact", head: true });
    console.log(`   ${t}: ${count}`);
  }
  console.log("=".repeat(50));
  console.log("\n✅ השחזור הושלם!");
}

main().catch((e) => {
  console.error("❌ Fatal:", e.message);
  process.exit(1);
});
