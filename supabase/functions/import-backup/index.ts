import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

// Use flexible type to support Hebrew field names from Excel
interface BackupClient {
  id?: string;
  name?: string;
  name_clean?: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  status?: string;
  stage?: string;
  source?: string;
  notes?: string;
  tags?: string[];
  custom_data?: Record<string, any>;
  position?: string;
  phone_secondary?: string;
  whatsapp?: string;
  website?: string;
  linkedin?: string;
  preferred_contact?: string;
  budget_range?: string;
  is_sample?: boolean;
  created_date?: string;
  updated_date?: string;
  // Hebrew field names
  שם?: string;
  "שם לקוח"?: string;
  אימייל?: string;
  "כתובת מייל"?: string;
  טלפון?: string;
  "טלפון ראשי"?: string;
  "טלפון משני"?: string;
  כתובת?: string;
  חברה?: string;
  סטטוס?: string;
  שלב?: string;
  הערות?: string;
  תפקיד?: string;
  ווצאפ?: string;
  אתר?: string;
  [key: string]: any; // Allow any other field
}

interface BackupTask {
  id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  client_id?: string;
  client_name?: string;
  project_id?: string;
  assigned_to?: string;
  tags?: string[];
  created_date?: string;
}

interface BackupTimeLog {
  id: string;
  client_id?: string;
  client_name?: string;
  log_date?: string;
  duration_seconds?: number;
  title?: string;
  notes?: string;
  created_date?: string;
}

interface BackupMeeting {
  id: string;
  title?: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  start_time?: string;
  end_time?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  notes?: string;
  status?: string;
  attendees?: string[];
  created_date?: string;
}

interface BackupQuote {
  id: string;
  client_id?: string;
  client_name?: string;
  amount?: number;
  total?: number;
  status?: string;
  description?: string;
  title?: string;
  created_date?: string;
  valid_until?: string;
  items?: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    total?: number;
  }>;
}

interface BackupInvoice {
  id: string;
  client_id?: string;
  client_name?: string;
  amount?: number;
  total?: number;
  status?: string;
  description?: string;
  invoice_number?: string;
  issue_date?: string;
  due_date?: string;
  paid_amount?: number;
  created_date?: string;
}

interface BackupCustomSpreadsheet {
  id: string;
  name: string;
  description?: string;
  columns?: any[];
  rows?: any[];
  created_by_id?: string;
  created_date?: string;
  updated_date?: string;
}

interface BackupCustomTable {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  columns?: any[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface BackupCustomTableData {
  id: string;
  table_id: string;
  table_name?: string;
  data: Record<string, any>;
  field_metadata?: Record<string, any>;
  linked_client_id?: string;
  linked_client_name?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

interface BackupTeamMember {
  id: string;
  name?: string;
  full_name?: string; // Support both name formats
  email?: string;
  role?: string;
  phone?: string;
  department?: string;
  position?: string;
  hourly_rate?: number;
  status?: string;
  user_id?: string;
  created_date?: string;
}

interface BackupUserPreferences {
  id: string;
  user_id?: string;
  preferences?: Record<string, any>;
  theme?: string;
  language?: string;
  notifications_enabled?: boolean;
  created_date?: string;
  updated_date?: string;
}

interface BackupProject {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  client_name?: string;
  status?: string;
  priority?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  created_date?: string;
}

interface BackupAccessControl {
  id: string;
  user_email: string;
  role: string;
  permissions?: Record<string, any>;
  is_active?: boolean;
}

interface BackupUserPreferences {
  id: string;
  user_email: string;
  theme?: string;
  language?: string;
  notifications_enabled?: boolean;
  default_view?: string;
}

interface BackupData {
  Client?: BackupClient[];
  Task?: BackupTask[];
  TimeLog?: BackupTimeLog[];
  Meeting?: BackupMeeting[];
  Quote?: BackupQuote[];
  Invoice?: BackupInvoice[];
  Project?: BackupProject[];
  AccessControl?: BackupAccessControl[];
  UserPreferences?: BackupUserPreferences[];
  CustomSpreadsheet?: BackupCustomSpreadsheet[];
  TeamMember?: BackupTeamMember[];
  CustomTable?: BackupCustomTable[];
  CustomTableData?: BackupCustomTableData[];
}

// Map Hebrew statuses to valid DB values
const statusMap: Record<string, string> = {
  פוטנציאלי: "active",
  פעיל: "active",
  "לא פעיל": "inactive",
  ארכיון: "archived",
  ברור_תכן: "active",
  תיק_מידע: "active",
  היתרים: "active",
  ביצוע: "active",
  סיום: "inactive",
  active: "active",
  inactive: "inactive",
  archived: "archived",
};

const normalizeStatus = (status?: string): string => {
  if (!status) return "active";
  const normalized = status.trim().toLowerCase();
  return statusMap[normalized] || statusMap[status] || "active";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: backupData, userId } = (await req.json()) as {
      data: BackupData;
      userId: string;
    };

    if (!backupData || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing backup data or userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Starting comprehensive backup import...");
    console.log("Data counts:", {
      clients: backupData.Client?.length || 0,
      tasks: backupData.Task?.length || 0,
      timeLogs: backupData.TimeLog?.length || 0,
      meetings: backupData.Meeting?.length || 0,
      quotes: backupData.Quote?.length || 0,
      invoices: backupData.Invoice?.length || 0,
      projects: backupData.Project?.length || 0,
    });

    const results = {
      clients: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      tasks: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      timeLogs: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      meetings: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      quotes: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      invoices: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      projects: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      customSpreadsheets: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      teamMembers: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      userPreferences: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      customTables: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      customTableData: { imported: 0, updated: 0, skipped: 0, errors: 0 },
      accessControl: { imported: 0, updated: 0, skipped: 0, errors: 0 },
    };

    // Map old IDs to new IDs and names to IDs
    const clientIdMap = new Map<string, string>();
    const clientNameMap = new Map<string, string>();

    // Get existing clients to avoid duplicates and build name map
    const { data: existingClients } = await supabase
      .from("clients")
      .select("id, name, name_clean, original_id, email, phone");

    if (existingClients) {
      for (const client of existingClients) {
        const normalizedName = (client.name_clean || client.name || "")
          .trim()
          .toLowerCase();
        if (normalizedName) {
          clientNameMap.set(normalizedName, client.id);
        }
        if (client.original_id) {
          clientIdMap.set(client.original_id, client.id);
        }
      }
    }

    // 1. Import/Update Clients
    if (backupData.Client && backupData.Client.length > 0) {
      console.log(`Processing ${backupData.Client.length} clients...`);

      // Log first client for debugging
      if (backupData.Client.length > 0) {
        console.log(
          "Sample client data:",
          JSON.stringify(backupData.Client[0]).slice(0, 500),
        );
      }

      for (const client of backupData.Client) {
        try {
          // Skip if no valid name
          if (!client.name && !client.שם) {
            console.log("Skipping client with no name");
            results.clients.skipped++;
            continue;
          }

          // Handle Hebrew field names from Excel
          const clientName =
            client.name || client.שם || client["שם לקוח"] || "ללא שם";
          const normalizedName = clientName.trim().toLowerCase();
          const existingId =
            (client.id ? clientIdMap.get(client.id) : undefined) ||
            clientNameMap.get(normalizedName);

          const clientData = {
            name: clientName,
            name_clean: client.name_clean || clientName,
            email:
              client.email || client.אימייל || client["כתובת מייל"] || null,
            phone: client.phone || client.טלפון || client["טלפון ראשי"] || null,
            address: client.address || client.כתובת || null,
            company: client.company || client.חברה || null,
            status: normalizeStatus(client.status || client.סטטוס),
            stage: client.stage || client.שלב || null,
            source: client.source || "imported_backup",
            notes: client.notes || client.הערות || null,
            tags: Array.isArray(client.tags) ? client.tags : [],
            custom_data: client.custom_data || {},
            position: client.position || client.תפקיד || null,
            phone_secondary:
              client.phone_secondary || client["טלפון משני"] || null,
            whatsapp: client.whatsapp || client.ווצאפ || null,
            website: client.website || client.אתר || null,
            linkedin: client.linkedin || null,
            preferred_contact: client.preferred_contact || null,
            budget_range: client.budget_range || null,
            is_sample: client.is_sample || false,
            original_id: client.id || null,
            created_by: userId,
          };

          if (existingId) {
            // Update existing client - remove created_by from update
            const { created_by, ...updateData } = clientData;
            const { error } = await supabase
              .from("clients")
              .update(updateData)
              .eq("id", existingId);

            if (error) {
              console.error(
                `Error updating client ${clientName}:`,
                JSON.stringify(error),
              );
              results.clients.errors++;
            } else {
              if (client.id) clientIdMap.set(client.id, existingId);
              results.clients.updated++;
            }
          } else {
            // Insert new client
            const { data: inserted, error } = await supabase
              .from("clients")
              .insert(clientData)
              .select("id")
              .single();

            if (error) {
              console.error(
                `Error inserting client ${clientName}:`,
                JSON.stringify(error),
              );
              results.clients.errors++;
            } else {
              if (client.id) clientIdMap.set(client.id, inserted.id);
              clientNameMap.set(normalizedName, inserted.id);
              results.clients.imported++;
            }
          }
        } catch (e) {
          console.error(`Exception processing client:`, e);
          results.clients.errors++;
        }
      }
    }

    // Helper function to find client ID by name or original ID
    const findClientId = (
      originalId?: string,
      clientName?: string,
    ): string | null => {
      if (originalId && clientIdMap.has(originalId)) {
        return clientIdMap.get(originalId)!;
      }
      if (clientName) {
        const normalizedName = clientName.trim().toLowerCase();
        if (clientNameMap.has(normalizedName)) {
          return clientNameMap.get(normalizedName)!;
        }
      }
      return null;
    };

    // Get existing tasks to check for duplicates
    const { data: existingTasks } = await supabase
      .from("tasks")
      .select("id, title, description");

    const existingTaskSet = new Set(
      existingTasks?.map((t) => `${t.title}::${t.description || ""}`) || [],
    );

    // 2. Import Tasks
    if (backupData.Task && backupData.Task.length > 0) {
      console.log(`Processing ${backupData.Task.length} tasks...`);

      for (const task of backupData.Task) {
        try {
          // Check for duplicates
          const taskKey = `${task.title}::${task.description || ""}`;
          if (existingTaskSet.has(taskKey)) {
            results.tasks.skipped++;
            continue;
          }

          // Map priority
          let priority = "medium";
          if (task.priority === "גבוהה" || task.priority === "high")
            priority = "high";
          else if (task.priority === "נמוכה" || task.priority === "low")
            priority = "low";

          // Map status
          let status = "pending";
          if (
            task.status === "הושלם" ||
            task.status === "completed" ||
            task.status === "הושלמה"
          )
            status = "completed";
          else if (task.status === "בתהליך" || task.status === "in_progress")
            status = "in_progress";
          else if (task.status === "חדשה" || task.status === "new")
            status = "pending";

          const clientId = findClientId(task.client_id, task.client_name);

          const taskData = {
            title: task.title || "ללא כותרת",
            description: task.description || null,
            status,
            priority,
            due_date: task.due_date
              ? new Date(task.due_date).toISOString()
              : null,
            client_id: clientId,
            tags: Array.isArray(task.tags) ? task.tags : [],
            created_by: userId,
          };

          const { error } = await supabase.from("tasks").insert(taskData);

          if (error) {
            console.error(`Error inserting task ${task.title}:`, error);
            results.tasks.errors++;
          } else {
            existingTaskSet.add(taskKey);
            results.tasks.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting task:`, e);
          results.tasks.errors++;
        }
      }
    }

    // Get existing time entries to check for duplicates - using comprehensive key
    const { data: existingTimeEntries } = await supabase
      .from("time_entries")
      .select("id, client_id, start_time, duration_minutes, description");

    // Create a more comprehensive duplicate check key including description
    const existingTimeSet = new Set(
      existingTimeEntries?.map((t) => {
        const descNormalized = (t.description || "")
          .trim()
          .toLowerCase()
          .slice(0, 50);
        return `${t.client_id}::${t.start_time}::${t.duration_minutes}::${descNormalized}`;
      }) || [],
    );

    // Also track by original start_time + client for broader duplicate detection
    const existingTimeByDateClient = new Set(
      existingTimeEntries?.map((t) => {
        const dateOnly = t.start_time?.split("T")[0] || "";
        return `${t.client_id}::${dateOnly}::${t.duration_minutes}`;
      }) || [],
    );

    // 3. Import Time Logs
    if (backupData.TimeLog && backupData.TimeLog.length > 0) {
      console.log(`Processing ${backupData.TimeLog.length} time logs...`);

      for (const log of backupData.TimeLog) {
        try {
          // Convert duration_seconds to minutes
          const durationMinutes = log.duration_seconds
            ? Math.round(log.duration_seconds / 60)
            : 0;

          // Parse log_date to create start_time
          let startTime = new Date().toISOString();
          if (log.log_date) {
            try {
              const dateObj = new Date(log.log_date);
              if (!isNaN(dateObj.getTime())) {
                startTime = dateObj.toISOString();
              }
            } catch {
              // Keep default
            }
          }

          const clientId = findClientId(log.client_id, log.client_name);
          const descNormalized = (log.notes || log.title || "")
            .trim()
            .toLowerCase()
            .slice(0, 50);
          const dateOnly = startTime.split("T")[0];

          // Check for duplicates using comprehensive key
          const timeKey = `${clientId}::${startTime}::${durationMinutes}::${descNormalized}`;
          const dateClientKey = `${clientId}::${dateOnly}::${durationMinutes}`;

          if (existingTimeSet.has(timeKey)) {
            results.timeLogs.skipped++;
            console.log(
              `Skipping duplicate time log (exact match): ${timeKey}`,
            );
            continue;
          }

          // Also check if same client + date + duration exists (likely duplicate with different timestamp)
          if (existingTimeByDateClient.has(dateClientKey) && descNormalized) {
            // Check if description matches any existing entry for this date/client/duration
            const possibleDuplicate = existingTimeEntries?.find((t) => {
              const tDateOnly = t.start_time?.split("T")[0] || "";
              const tDescNormalized = (t.description || "")
                .trim()
                .toLowerCase()
                .slice(0, 50);
              return (
                t.client_id === clientId &&
                tDateOnly === dateOnly &&
                t.duration_minutes === durationMinutes &&
                tDescNormalized === descNormalized
              );
            });

            if (possibleDuplicate) {
              results.timeLogs.skipped++;
              console.log(
                `Skipping duplicate time log (date+desc match): ${dateClientKey}`,
              );
              continue;
            }
          }

          // Calculate end_time from start_time + duration (duration_minutes is a generated column)
          const startDate = new Date(startTime);
          const endDate = new Date(
            startDate.getTime() + durationMinutes * 60 * 1000,
          );
          const endTime = endDate.toISOString();

          const timeEntryData = {
            user_id: userId,
            client_id: clientId,
            description: log.notes || log.title || null,
            start_time: startTime,
            end_time: endTime, // Set end_time so duration_minutes is calculated automatically
            is_billable: true,
            is_running: false,
          };

          const { error } = await supabase
            .from("time_entries")
            .insert(timeEntryData);

          if (error) {
            console.error(`Error inserting time log:`, error);
            results.timeLogs.errors++;
          } else {
            // Add to both sets to prevent duplicates within the same import
            existingTimeSet.add(timeKey);
            existingTimeByDateClient.add(dateClientKey);
            results.timeLogs.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting time log:`, e);
          results.timeLogs.errors++;
        }
      }
    }

    // Get existing meetings to check for duplicates
    const { data: existingMeetings } = await supabase
      .from("meetings")
      .select("id, title, start_time");

    const existingMeetingSet = new Set(
      existingMeetings?.map((m) => `${m.title}::${m.start_time}`) || [],
    );

    // 4. Import Meetings
    if (backupData.Meeting && backupData.Meeting.length > 0) {
      console.log(`Processing ${backupData.Meeting.length} meetings...`);

      for (const meeting of backupData.Meeting) {
        try {
          const startTime =
            meeting.start_time ||
            meeting.start_date ||
            new Date().toISOString();
          const endTime =
            meeting.end_time ||
            meeting.end_date ||
            new Date(Date.now() + 3600000).toISOString();

          // Check for duplicates
          const meetingKey = `${meeting.title}::${startTime}`;
          if (existingMeetingSet.has(meetingKey)) {
            results.meetings.skipped++;
            continue;
          }

          const clientId = findClientId(meeting.client_id, meeting.client_name);

          // Map status
          let status = "scheduled";
          if (meeting.status === "הושלם" || meeting.status === "completed")
            status = "completed";
          else if (meeting.status === "בוטל" || meeting.status === "cancelled")
            status = "cancelled";

          const meetingData = {
            title: meeting.title || "פגישה",
            description: meeting.description || null,
            client_id: clientId,
            start_time: startTime,
            end_time: endTime,
            location: meeting.location || null,
            notes: meeting.notes || null,
            status,
            attendees: Array.isArray(meeting.attendees)
              ? meeting.attendees
              : [],
            created_by: userId,
          };

          const { error } = await supabase.from("meetings").insert(meetingData);

          if (error) {
            console.error(`Error inserting meeting:`, error);
            results.meetings.errors++;
          } else {
            existingMeetingSet.add(meetingKey);
            results.meetings.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting meeting:`, e);
          results.meetings.errors++;
        }
      }
    }

    // 5. Import Quotes to quotes table
    if (backupData.Quote && backupData.Quote.length > 0) {
      console.log(`Processing ${backupData.Quote.length} quotes...`);

      // Get existing quotes to check for duplicates
      const { data: existingQuotes } = await supabase
        .from("quotes")
        .select("id, quote_number");

      const existingQuoteNumbers = new Set(
        existingQuotes?.map((q) => q.quote_number) || [],
      );

      for (const quote of backupData.Quote) {
        try {
          const clientId = findClientId(quote.client_id, quote.client_name);
          if (!clientId) {
            results.quotes.skipped++;
            continue;
          }

          const quoteNumber = `Q-${quote.id?.slice(-6) || Date.now().toString().slice(-6)}`;

          // Check for duplicates
          if (existingQuoteNumbers.has(quoteNumber)) {
            results.quotes.skipped++;
            continue;
          }

          // Map status
          let status = "draft";
          if (quote.status === "אושר" || quote.status === "approved")
            status = "approved";
          else if (quote.status === "נשלח" || quote.status === "sent")
            status = "sent";
          else if (quote.status === "נדחה" || quote.status === "rejected")
            status = "rejected";

          const quoteData = {
            quote_number: quoteNumber,
            client_id: clientId,
            total: quote.amount || quote.total || 0,
            status,
            description: quote.description || quote.title || null,
            valid_until: quote.valid_until
              ? new Date(quote.valid_until).toISOString().split("T")[0]
              : null,
            created_by: userId,
          };

          const { error } = await supabase.from("quotes").insert(quoteData);

          if (error) {
            console.error(`Error inserting quote:`, error);
            results.quotes.errors++;
          } else {
            existingQuoteNumbers.add(quoteNumber);
            results.quotes.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting quote:`, e);
          results.quotes.errors++;
        }
      }
    }

    // 6. Import Invoices directly
    if (backupData.Invoice && backupData.Invoice.length > 0) {
      console.log(`Processing ${backupData.Invoice.length} invoices...`);

      // Get existing invoices to check for duplicates
      const { data: existingInvoices } = await supabase
        .from("invoices")
        .select("id, invoice_number");

      const existingInvoiceNumbers = new Set(
        existingInvoices?.map((i) => i.invoice_number) || [],
      );

      for (const invoice of backupData.Invoice) {
        try {
          const clientId = findClientId(invoice.client_id, invoice.client_name);
          if (!clientId) {
            results.invoices.skipped++;
            continue;
          }

          const invoiceNumber =
            invoice.invoice_number ||
            `INV-${invoice.id?.slice(-6) || Date.now().toString().slice(-6)}`;

          // Check for duplicates
          if (existingInvoiceNumbers.has(invoiceNumber)) {
            results.invoices.skipped++;
            continue;
          }

          // Map status
          let status = "draft";
          if (invoice.status === "שולם" || invoice.status === "paid")
            status = "paid";
          else if (invoice.status === "נשלח" || invoice.status === "sent")
            status = "sent";
          else if (invoice.status === "באיחור" || invoice.status === "overdue")
            status = "overdue";
          else if (invoice.status === "בוטל" || invoice.status === "cancelled")
            status = "cancelled";

          const invoiceData = {
            invoice_number: invoiceNumber,
            client_id: clientId,
            amount: invoice.amount || invoice.total || 0,
            status,
            description: invoice.description || null,
            issue_date: invoice.issue_date
              ? new Date(invoice.issue_date).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
            due_date: invoice.due_date
              ? new Date(invoice.due_date).toISOString().split("T")[0]
              : null,
            paid_amount: invoice.paid_amount || 0,
            created_by: userId,
          };

          const { error } = await supabase.from("invoices").insert(invoiceData);

          if (error) {
            console.error(`Error inserting invoice:`, error);
            results.invoices.errors++;
          } else {
            existingInvoiceNumbers.add(invoiceNumber);
            results.invoices.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting invoice:`, e);
          results.invoices.errors++;
        }
      }
    }

    // 7. Import Projects
    if (backupData.Project && backupData.Project.length > 0) {
      console.log(`Processing ${backupData.Project.length} projects...`);

      // Get existing projects to check for duplicates
      const { data: existingProjects } = await supabase
        .from("projects")
        .select("id, name, client_id");

      const existingProjectSet = new Set(
        existingProjects?.map((p) => `${p.name}::${p.client_id || "null"}`) ||
          [],
      );

      for (const project of backupData.Project) {
        try {
          const clientId = findClientId(project.client_id, project.client_name);

          // Check for duplicates
          const projectKey = `${project.name}::${clientId || "null"}`;
          if (existingProjectSet.has(projectKey)) {
            results.projects.skipped++;
            continue;
          }

          // Map status
          let status = "planning";
          if (project.status === "פעיל" || project.status === "active")
            status = "active";
          else if (project.status === "הושלם" || project.status === "completed")
            status = "completed";
          else if (project.status === "בהמתנה" || project.status === "on-hold")
            status = "on-hold";
          else if (project.status === "מבוטל" || project.status === "cancelled")
            status = "cancelled";

          const projectData = {
            name: project.name,
            description: project.description || null,
            client_id: clientId,
            status,
            priority: project.priority || "medium",
            start_date: project.start_date
              ? new Date(project.start_date).toISOString().split("T")[0]
              : null,
            end_date: project.end_date
              ? new Date(project.end_date).toISOString().split("T")[0]
              : null,
            budget: project.budget || null,
            created_by: userId,
          };

          const { error } = await supabase.from("projects").insert(projectData);

          if (error) {
            console.error(`Error inserting project ${project.name}:`, error);
            results.projects.errors++;
          } else {
            existingProjectSet.add(projectKey);
            results.projects.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting project:`, e);
          results.projects.errors++;
        }
      }
    }

    // Import CustomSpreadsheets -> Convert to custom_tables + custom_table_data
    if (
      backupData.CustomSpreadsheet &&
      backupData.CustomSpreadsheet.length > 0
    ) {
      console.log(
        `Converting ${backupData.CustomSpreadsheet.length} custom spreadsheets to advanced tables...`,
      );
      console.log(
        "Sample spreadsheet:",
        JSON.stringify(backupData.CustomSpreadsheet[0]).slice(0, 500),
      );

      // Get existing tables to avoid duplicates
      const { data: existingTables } = await supabase
        .from("custom_tables")
        .select("id, name, display_name");

      const existingTableNames = new Set(
        existingTables?.map((t) => t.name?.toLowerCase()) || [],
      );
      const existingDisplayNames = new Set(
        existingTables?.map((t) => t.display_name?.toLowerCase()) || [],
      );
      const localTableIdMap = new Map<string, string>();

      for (const spreadsheet of backupData.CustomSpreadsheet as BackupCustomSpreadsheet[]) {
        try {
          const tableName =
            spreadsheet.name?.replace(/\s+/g, "_").toLowerCase() ||
            `table_${Date.now()}`;
          const displayName = spreadsheet.name || "טבלה מיובאת";

          // Check for duplicates
          if (
            existingTableNames.has(tableName) ||
            existingDisplayNames.has(displayName.toLowerCase())
          ) {
            console.log(`Skipping duplicate spreadsheet: ${displayName}`);
            results.customSpreadsheets.skipped++;
            continue;
          }

          // Convert columns from legacy format to new format
          const legacyColumns = spreadsheet.columns || [];
          const convertedColumns = legacyColumns.map(
            (col: any, index: number) => {
              // Map legacy column types to new types
              let columnType = "text";
              const legacyType = (col.type || "").toLowerCase();
              if (
                legacyType === "number" ||
                legacyType === "currency" ||
                legacyType === "מספר"
              )
                columnType = "number";
              else if (
                legacyType === "boolean" ||
                legacyType === "checkbox" ||
                legacyType === "בוליאני"
              )
                columnType = "boolean";
              else if (legacyType === "date" || legacyType === "תאריך")
                columnType = "date";
              else if (legacyType === "select" || legacyType === "בחירה")
                columnType = "select";

              return {
                id: col.key || col.id || `col_${index}`,
                name: col.title || col.name || `עמודה ${index + 1}`,
                type: columnType,
                width: col.width || 150,
                required: col.required || false,
                options: col.options || [],
              };
            },
          );

          // Insert to custom_tables
          const tableData = {
            name: tableName,
            display_name: displayName,
            description:
              spreadsheet.description || `מיובא מגיליון: ${spreadsheet.name}`,
            icon: "Table",
            columns: convertedColumns,
            created_by: userId,
          };

          const { data: inserted, error: tableError } = await supabase
            .from("custom_tables")
            .insert(tableData)
            .select("id")
            .single();

          if (tableError) {
            console.error(
              `Error creating table from spreadsheet ${spreadsheet.name}:`,
              tableError,
            );
            results.customSpreadsheets.errors++;
            continue;
          }

          const newTableId = inserted.id;
          localTableIdMap.set(spreadsheet.id, newTableId);
          existingTableNames.add(tableName);
          existingDisplayNames.add(displayName.toLowerCase());

          // Now import rows as custom_table_data
          const rows = spreadsheet.rows || [];
          let rowsImported = 0;

          for (const row of rows) {
            // Row can be an object with column keys or an array
            let rowData: Record<string, any> = {};

            if (Array.isArray(row)) {
              // Convert array to object using column keys
              convertedColumns.forEach((col: any, idx: number) => {
                if (row[idx] !== undefined) {
                  rowData[col.id] = row[idx];
                }
              });
            } else if (typeof row === "object") {
              rowData = { ...row };
              // Remove internal fields
              delete rowData.id;
              delete rowData._id;
            }

            // Try to find linked client
            let linkedClientId: string | null = null;
            if (row.client_id) {
              linkedClientId = clientIdMap.get(row.client_id) || null;
            } else if (row.client_name) {
              linkedClientId = findClientId(undefined, row.client_name);
            }

            const { error: rowError } = await supabase
              .from("custom_table_data")
              .insert({
                table_id: newTableId,
                data: rowData,
                linked_client_id: linkedClientId,
                created_by: userId,
              });

            if (!rowError) {
              rowsImported++;
            }
          }

          console.log(
            `Converted spreadsheet "${displayName}": ${convertedColumns.length} columns, ${rowsImported}/${rows.length} rows`,
          );
          results.customSpreadsheets.imported++;
        } catch (e) {
          console.error(`Exception converting spreadsheet:`, e);
          results.customSpreadsheets.errors++;
        }
      }
    }

    // Import TeamMembers (Employees) - with full_name support
    if (backupData.TeamMember && backupData.TeamMember.length > 0) {
      console.log(`Importing ${backupData.TeamMember.length} team members...`);
      console.log(
        "Sample team member:",
        JSON.stringify(backupData.TeamMember[0]).slice(0, 300),
      );

      // Get existing employees to avoid duplicates
      const { data: existingEmployees } = await supabase
        .from("employees")
        .select("id, email");

      const existingEmails = new Set(
        existingEmployees?.map((e) => e.email?.toLowerCase()) || [],
      );
      const emailToIdMap = new Map(
        existingEmployees?.map((e) => [e.email?.toLowerCase(), e.id]) || [],
      );

      for (const member of backupData.TeamMember as BackupTeamMember[]) {
        try {
          if (!member.email) {
            console.log("Skipping team member with no email");
            results.teamMembers.skipped++;
            continue;
          }

          const emailLower = member.email.toLowerCase();

          // Use full_name OR name (support both formats)
          const memberName =
            member.full_name || member.name || member.email.split("@")[0];

          // Map role
          let role = "employee";
          const memberRole = member.role?.toLowerCase() || "";
          if (
            memberRole === "admin" ||
            memberRole === "מנהל" ||
            memberRole === "super_admin"
          )
            role = "admin";
          else if (memberRole === "manager" || memberRole === "מנהל צוות")
            role = "manager";

          // Map status
          let status = "active";
          if (member.status === "inactive" || member.status === "לא פעיל")
            status = "inactive";

          if (existingEmails.has(emailLower)) {
            // Update existing employee
            const existingId = emailToIdMap.get(emailLower);
            if (existingId) {
              const { error } = await supabase
                .from("employees")
                .update({
                  name: memberName,
                  phone: member.phone || null,
                  department: member.department || null,
                  position: member.position || null,
                  hourly_rate: member.hourly_rate || null,
                  role,
                  status,
                })
                .eq("id", existingId);

              if (error) {
                console.error(
                  `Error updating team member ${member.email}:`,
                  error,
                );
                results.teamMembers.errors++;
              } else {
                results.teamMembers.updated++;
              }
            } else {
              results.teamMembers.skipped++;
            }
            continue;
          }

          const employeeData = {
            name: memberName,
            email: member.email,
            role,
            status,
            phone: member.phone || null,
            department: member.department || null,
            position: member.position || null,
            hourly_rate: member.hourly_rate || null,
          };

          const { error } = await supabase
            .from("employees")
            .insert(employeeData);

          if (error) {
            console.error(
              `Error inserting team member ${member.email}:`,
              error,
            );
            results.teamMembers.errors++;
          } else {
            existingEmails.add(emailLower);
            results.teamMembers.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting team member:`, e);
          results.teamMembers.errors++;
        }
      }
    }

    // Import UserPreferences
    if (backupData.UserPreferences && backupData.UserPreferences.length > 0) {
      console.log(
        `Importing ${backupData.UserPreferences.length} user preferences...`,
      );

      for (const pref of backupData.UserPreferences as BackupUserPreferences[]) {
        try {
          const prefData = {
            user_id: userId, // Use current user since we can't map old user IDs
            preferences: pref.preferences || {},
            theme: pref.theme || "system",
            language: pref.language || "he",
            notifications_enabled: pref.notifications_enabled !== false,
          };

          // Check if preferences exist for this user
          const { data: existing } = await supabase
            .from("user_preferences")
            .select("id")
            .eq("user_id", userId)
            .single();

          if (existing) {
            // Update existing
            const { error } = await supabase
              .from("user_preferences")
              .update(prefData)
              .eq("user_id", userId);

            if (error) {
              console.error(`Error updating user preferences:`, error);
              results.userPreferences.errors++;
            } else {
              results.userPreferences.updated++;
            }
          } else {
            // Insert new
            const { error } = await supabase
              .from("user_preferences")
              .insert(prefData);

            if (error) {
              console.error(`Error inserting user preferences:`, error);
              results.userPreferences.errors++;
            } else {
              results.userPreferences.imported++;
            }
          }
        } catch (e) {
          console.error(`Exception handling user preferences:`, e);
          results.userPreferences.errors++;
        }
      }
    }

    // Import CustomTables (advanced tables)
    const tableIdMap = new Map<string, string>(); // Map old table IDs to new ones
    const tableNameMap = new Map<string, string>(); // Map table names to new IDs

    if (backupData.CustomTable && backupData.CustomTable.length > 0) {
      console.log(
        `Importing ${backupData.CustomTable.length} custom tables...`,
      );

      // Get existing tables to avoid duplicates
      const { data: existingTables } = await supabase
        .from("custom_tables")
        .select("id, name, display_name");

      const existingTableNames = new Set(
        existingTables?.map((t) => t.name?.toLowerCase()) || [],
      );
      const existingTableDisplayNames = new Set(
        existingTables?.map((t) => t.display_name?.toLowerCase()) || [],
      );

      // Also map existing tables
      for (const table of existingTables || []) {
        tableNameMap.set(table.name?.toLowerCase() || "", table.id);
        tableNameMap.set(table.display_name?.toLowerCase() || "", table.id);
      }

      for (const table of backupData.CustomTable as BackupCustomTable[]) {
        try {
          if (!table.name && !table.display_name) {
            results.customTables.skipped++;
            continue;
          }

          const tableName =
            table.name || table.display_name || "imported_table";
          const tableDisplayName =
            table.display_name || table.name || "טבלה מיובאת";
          const normalizedName = tableName.toLowerCase();
          const normalizedDisplayName = tableDisplayName.toLowerCase();

          // Check if table already exists
          if (
            existingTableNames.has(normalizedName) ||
            existingTableDisplayNames.has(normalizedDisplayName)
          ) {
            // Map the old ID to existing table
            const existingId =
              tableNameMap.get(normalizedName) ||
              tableNameMap.get(normalizedDisplayName);
            if (existingId && table.id) {
              tableIdMap.set(table.id, existingId);
            }
            results.customTables.skipped++;
            continue;
          }

          const tableData = {
            name: tableName,
            display_name: tableDisplayName,
            description: table.description || null,
            icon: table.icon || "Table",
            columns: table.columns || [],
            created_by: userId,
          };

          const { data: inserted, error } = await supabase
            .from("custom_tables")
            .insert(tableData)
            .select("id")
            .single();

          if (error) {
            console.error(`Error inserting custom table ${tableName}:`, error);
            results.customTables.errors++;
          } else {
            if (table.id) tableIdMap.set(table.id, inserted.id);
            tableNameMap.set(normalizedName, inserted.id);
            tableNameMap.set(normalizedDisplayName, inserted.id);
            existingTableNames.add(normalizedName);
            existingTableDisplayNames.add(normalizedDisplayName);
            results.customTables.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting custom table:`, e);
          results.customTables.errors++;
        }
      }
    }

    // Import CustomTableData
    if (backupData.CustomTableData && backupData.CustomTableData.length > 0) {
      console.log(
        `Importing ${backupData.CustomTableData.length} custom table data rows...`,
      );

      for (const row of backupData.CustomTableData as BackupCustomTableData[]) {
        try {
          // Find the new table ID
          let newTableId: string | null = null;

          if (row.table_id && tableIdMap.has(row.table_id)) {
            newTableId = tableIdMap.get(row.table_id)!;
          } else if (row.table_name) {
            const normalizedName = row.table_name.toLowerCase();
            newTableId = tableNameMap.get(normalizedName) || null;
          }

          if (!newTableId) {
            console.log(
              `Skipping table data - table not found: ${row.table_id || row.table_name}`,
            );
            results.customTableData.skipped++;
            continue;
          }

          // Find linked client if specified
          let linkedClientId: string | null = null;
          if (row.linked_client_id) {
            linkedClientId = clientIdMap.get(row.linked_client_id) || null;
          } else if (row.linked_client_name) {
            linkedClientId = findClientId(undefined, row.linked_client_name);
          }

          const rowData = {
            table_id: newTableId,
            data: row.data || {},
            field_metadata: row.field_metadata || null,
            linked_client_id: linkedClientId,
            created_by: userId,
          };

          const { error } = await supabase
            .from("custom_table_data")
            .insert(rowData);

          if (error) {
            console.error(`Error inserting custom table data:`, error);
            results.customTableData.errors++;
          } else {
            results.customTableData.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting custom table data:`, e);
          results.customTableData.errors++;
        }
      }
    }

    // Import AccessControl (user roles and permissions)
    if (backupData.AccessControl && backupData.AccessControl.length > 0) {
      console.log(
        `Importing ${backupData.AccessControl.length} access control entries...`,
      );
      console.log(
        "Sample access control:",
        JSON.stringify(backupData.AccessControl[0]).slice(0, 300),
      );

      for (const access of backupData.AccessControl as BackupAccessControl[]) {
        try {
          if (!access.user_email) {
            console.log("Skipping access control with no email");
            results.accessControl.skipped++;
            continue;
          }

          // Find user by email in profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", access.user_email.toLowerCase())
            .single();

          if (!profile) {
            console.log(`No profile found for ${access.user_email}`);
            results.accessControl.skipped++;
            continue;
          }

          // Map role
          const roleMap: Record<string, string> = {
            super_admin: "admin",
            admin: "admin",
            manager: "manager",
            user: "employee",
            employee: "employee",
            client: "client",
            מנהל: "admin",
            "מנהל צוות": "manager",
            עובד: "employee",
          };

          const mappedRole =
            roleMap[access.role?.toLowerCase() || ""] || "employee";

          // Check if role already exists
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("id")
            .eq("user_id", profile.id)
            .eq("role", mappedRole)
            .single();

          if (existingRole) {
            results.accessControl.skipped++;
            continue;
          }

          // Insert role
          const { error } = await supabase.from("user_roles").insert({
            user_id: profile.id,
            role: mappedRole,
          });

          if (error) {
            console.error(
              `Error inserting access control for ${access.user_email}:`,
              error,
            );
            results.accessControl.errors++;
          } else {
            results.accessControl.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting access control:`, e);
          results.accessControl.errors++;
        }
      }
    }

    console.log("Import completed:", results);

    const summary = {
      לקוחות: `${results.clients.imported} חדשים, ${results.clients.updated} עודכנו, ${results.clients.skipped} דולגו, ${results.clients.errors} שגיאות`,
      משימות: `${results.tasks.imported} חדשים, ${results.tasks.skipped} דולגו, ${results.tasks.errors} שגיאות`,
      רישומי_זמן: `${results.timeLogs.imported} חדשים, ${results.timeLogs.skipped} דולגו, ${results.timeLogs.errors} שגיאות`,
      פגישות: `${results.meetings.imported} חדשים, ${results.meetings.skipped} דולגו, ${results.meetings.errors} שגיאות`,
      הצעות_מחיר: `${results.quotes.imported} חדשים, ${results.quotes.skipped} דולגו, ${results.quotes.errors} שגיאות`,
      חשבוניות: `${results.invoices.imported} חדשים, ${results.invoices.skipped} דולגו, ${results.invoices.errors} שגיאות`,
      פרויקטים: `${results.projects.imported} חדשים, ${results.projects.skipped} דולגו, ${results.projects.errors} שגיאות`,
      טבלאות_מותאמות: `${results.customSpreadsheets.imported} גיליונות הומרו לטבלאות, ${results.customSpreadsheets.skipped} דולגו, ${results.customSpreadsheets.errors} שגיאות`,
      טבלאות_מתקדמות: `${results.customTables.imported} חדשים, ${results.customTables.skipped} דולגו, ${results.customTables.errors} שגיאות`,
      נתוני_טבלאות: `${results.customTableData.imported} חדשים, ${results.customTableData.skipped} דולגו, ${results.customTableData.errors} שגיאות`,
      עובדים: `${results.teamMembers.imported} חדשים, ${results.teamMembers.updated || 0} עודכנו, ${results.teamMembers.skipped} דולגו, ${results.teamMembers.errors} שגיאות`,
      הרשאות: `${results.accessControl.imported} חדשים, ${results.accessControl.skipped} דולגו, ${results.accessControl.errors} שגיאות`,
      העדפות_משתמשים: `${results.userPreferences.imported} חדשים, ${results.userPreferences.updated} עודכנו, ${results.userPreferences.errors} שגיאות`,
    };

    return new Response(
      JSON.stringify({
        success: true,
        results,
        summary,
        message: `ייבוא הושלם בהצלחה!`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Import error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
