import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

interface BackupResult {
  success: boolean;
  tables: Record<string, number>;
  totalRecords: number;
  timestamp: string;
  storageUrl?: string;
  error?: string;
}

// Parent tables precede their children so the same file can be restored while
// preserving process, payment, quote and inspection-form relationships.
const TABLES_TO_BACKUP = [
  "profiles",
  "employees",
  "clients",
  "client_categories",
  "client_sources",
  "client_contacts",
  "projects",
  "time_entries",
  "meetings",
  "reminders",
  "stage_templates",
  "stage_template_stages",
  "stage_template_tasks",
  "client_stages",
  "client_folder_stages",
  "client_folder_tasks",
  "client_deadlines",
  "deadline_templates",
  "quote_template_folders",
  "quote_templates",
  "quote_template_versions",
  "quotes",
  "quote_items",
  "quote_payments",
  "saved_quotes",
  "client_stage_tasks",
  "client_task_message_settings",
  "client_task_message_log",
  "saved_quote_payment_events",
  "qp_folders",
  "qp_themes",
  "qp_documents",
  "qp_versions",
  "contract_templates",
  "contracts",
  "contract_documents",
  "contract_amendments",
  "quote_client_creation_operations",
  "invoices",
  "invoice_payments",
  "payment_schedules",
  "payments",
  "inspection_form_folders",
  "inspection_form_templates",
  "inspection_form_template_steps",
  "inspection_form_runs",
  "inspection_form_run_steps",
  "tasks",
  "client_payment_stages",
  "client_additional_payments",
  "client_custom_tabs",
  "client_tab_columns",
  "client_tab_data",
  "client_tab_files",
  "custom_tables",
  "custom_table_data",
  "custom_table_permissions",
  "table_custom_columns",
  "app_settings",
  "user_settings",
] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting automatic backup...");

    const timestamp = new Date().toISOString();
    const dateStr = timestamp.split("T")[0];

    const backupData: Record<string, any[]> = {};
    const recordCounts: Record<string, number> = {};
    const failedTables: string[] = [];
    let totalRecords = 0;

    // Fetch data from each table
    for (const table of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabase.from(table).select("*");

        if (error) {
          console.error(`Error fetching ${table}:`, error);
          failedTables.push(`${table}: ${error.message}`);
        } else {
          backupData[table] = data || [];
          recordCounts[table] = data?.length || 0;
          totalRecords += data?.length || 0;
        }
      } catch (e) {
        console.error(`Exception fetching ${table}:`, e);
        failedTables.push(
          `${table}: ${e instanceof Error ? e.message : "Unknown error"}`,
        );
      }
    }

    if (failedTables.length > 0) {
      throw new Error(
        `Backup aborted; ${failedTables.length} tables failed: ${failedTables.join(
          " | ",
        )}`,
      );
    }

    console.log(
      `Backup collected ${totalRecords} records from ${TABLES_TO_BACKUP.length} tables`,
    );

    // Create backup object
    const backup = {
      metadata: {
        version: "1.0.0",
        createdAt: timestamp,
        tables: recordCounts,
        totalRecords,
      },
      data: backupData,
    };

    // Convert to JSON
    const backupJson = JSON.stringify(backup, null, 2);
    const backupBlob = new Blob([backupJson], { type: "application/json" });

    // Check if backups bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const backupsBucket = buckets?.find((b) => b.name === "backups");

    if (!backupsBucket) {
      console.log("Creating backups bucket...");
      const { error: createError } = await supabase.storage.createBucket(
        "backups",
        {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        },
      );

      if (createError) {
        console.error("Error creating backups bucket:", createError);
      }
    }

    // Upload to storage
    const fileName = `backup-${dateStr}-${Date.now()}.json`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("backups")
      .upload(fileName, backupBlob, {
        contentType: "application/json",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading backup:", uploadError);
      // Continue anyway - backup data is still available
    } else {
      console.log(`Backup uploaded: ${fileName}`);
    }

    // Get public URL (or signed URL for private bucket)
    let storageUrl: string | undefined;
    if (uploadData) {
      const { data: urlData } = await supabase.storage
        .from("backups")
        .createSignedUrl(fileName, 86400 * 7); // 7 days

      storageUrl = urlData?.signedUrl;
    }

    // Clean up old backups (keep last 30)
    try {
      const { data: files } = await supabase.storage.from("backups").list("", {
        sortBy: { column: "created_at", order: "desc" },
      });

      if (files && files.length > 30) {
        const filesToDelete = files.slice(30).map((f) => f.name);
        console.log(`Deleting ${filesToDelete.length} old backups...`);

        await supabase.storage.from("backups").remove(filesToDelete);
      }
    } catch (e) {
      console.error("Error cleaning old backups:", e);
    }

    const result: BackupResult = {
      success: true,
      tables: recordCounts,
      totalRecords,
      timestamp,
      storageUrl,
    };

    console.log("Automatic backup completed successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Backup failed:", error);

    const result: BackupResult = {
      success: false,
      tables: {},
      totalRecords: 0,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(result), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
