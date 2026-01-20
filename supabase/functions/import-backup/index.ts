import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  "שם"?: string;
  "שם לקוח"?: string;
  "אימייל"?: string;
  "כתובת מייל"?: string;
  "טלפון"?: string;
  "טלפון ראשי"?: string;
  "טלפון משני"?: string;
  "כתובת"?: string;
  "חברה"?: string;
  "סטטוס"?: string;
  "שלב"?: string;
  "הערות"?: string;
  "תפקיד"?: string;
  "ווצאפ"?: string;
  "אתר"?: string;
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

interface BackupTeamMember {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  department?: string;
  position?: string;
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
}

// Map Hebrew statuses to valid DB values
const statusMap: Record<string, string> = {
  'פוטנציאלי': 'active',
  'פעיל': 'active',
  'לא פעיל': 'inactive',
  'ארכיון': 'archived',
  'ברור_תכן': 'active',
  'תיק_מידע': 'active',
  'היתרים': 'active',
  'ביצוע': 'active',
  'סיום': 'inactive',
  'active': 'active',
  'inactive': 'inactive',
  'archived': 'archived',
};

const normalizeStatus = (status?: string): string => {
  if (!status) return 'active';
  const normalized = status.trim().toLowerCase();
  return statusMap[normalized] || statusMap[status] || 'active';
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: backupData, userId } = await req.json() as { data: BackupData; userId: string };

    if (!backupData || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing backup data or userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        const normalizedName = (client.name_clean || client.name || "").trim().toLowerCase();
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
        console.log("Sample client data:", JSON.stringify(backupData.Client[0]).slice(0, 500));
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
          const clientName = client.name || client.שם || client["שם לקוח"] || "ללא שם";
          const normalizedName = clientName.trim().toLowerCase();
          const existingId = (client.id ? clientIdMap.get(client.id) : undefined) || clientNameMap.get(normalizedName);
          
          const clientData = {
            name: clientName,
            name_clean: client.name_clean || clientName,
            email: client.email || client.אימייל || client["כתובת מייל"] || null,
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
            phone_secondary: client.phone_secondary || client["טלפון משני"] || null,
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
              console.error(`Error updating client ${clientName}:`, JSON.stringify(error));
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
              console.error(`Error inserting client ${clientName}:`, JSON.stringify(error));
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
    const findClientId = (originalId?: string, clientName?: string): string | null => {
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
      existingTasks?.map(t => `${t.title}::${t.description || ''}`) || []
    );

    // 2. Import Tasks
    if (backupData.Task && backupData.Task.length > 0) {
      console.log(`Processing ${backupData.Task.length} tasks...`);
      
      for (const task of backupData.Task) {
        try {
          // Check for duplicates
          const taskKey = `${task.title}::${task.description || ''}`;
          if (existingTaskSet.has(taskKey)) {
            results.tasks.skipped++;
            continue;
          }

          // Map priority
          let priority = "medium";
          if (task.priority === "גבוהה" || task.priority === "high") priority = "high";
          else if (task.priority === "נמוכה" || task.priority === "low") priority = "low";

          // Map status
          let status = "pending";
          if (task.status === "הושלם" || task.status === "completed" || task.status === "הושלמה") status = "completed";
          else if (task.status === "בתהליך" || task.status === "in_progress") status = "in_progress";
          else if (task.status === "חדשה" || task.status === "new") status = "pending";

          const clientId = findClientId(task.client_id, task.client_name);

          const taskData = {
            title: task.title || "ללא כותרת",
            description: task.description || null,
            status,
            priority,
            due_date: task.due_date ? new Date(task.due_date).toISOString() : null,
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
      existingTimeEntries?.map(t => {
        const descNormalized = (t.description || '').trim().toLowerCase().slice(0, 50);
        return `${t.client_id}::${t.start_time}::${t.duration_minutes}::${descNormalized}`;
      }) || []
    );

    // Also track by original start_time + client for broader duplicate detection
    const existingTimeByDateClient = new Set(
      existingTimeEntries?.map(t => {
        const dateOnly = t.start_time?.split('T')[0] || '';
        return `${t.client_id}::${dateOnly}::${t.duration_minutes}`;
      }) || []
    );

    // 3. Import Time Logs
    if (backupData.TimeLog && backupData.TimeLog.length > 0) {
      console.log(`Processing ${backupData.TimeLog.length} time logs...`);
      
      for (const log of backupData.TimeLog) {
        try {
          // Convert duration_seconds to minutes
          const durationMinutes = log.duration_seconds ? Math.round(log.duration_seconds / 60) : 0;
          
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
          const descNormalized = (log.notes || log.title || '').trim().toLowerCase().slice(0, 50);
          const dateOnly = startTime.split('T')[0];

          // Check for duplicates using comprehensive key
          const timeKey = `${clientId}::${startTime}::${durationMinutes}::${descNormalized}`;
          const dateClientKey = `${clientId}::${dateOnly}::${durationMinutes}`;
          
          if (existingTimeSet.has(timeKey)) {
            results.timeLogs.skipped++;
            console.log(`Skipping duplicate time log (exact match): ${timeKey}`);
            continue;
          }
          
          // Also check if same client + date + duration exists (likely duplicate with different timestamp)
          if (existingTimeByDateClient.has(dateClientKey) && descNormalized) {
            // Check if description matches any existing entry for this date/client/duration
            const possibleDuplicate = existingTimeEntries?.find(t => {
              const tDateOnly = t.start_time?.split('T')[0] || '';
              const tDescNormalized = (t.description || '').trim().toLowerCase().slice(0, 50);
              return t.client_id === clientId && 
                     tDateOnly === dateOnly && 
                     t.duration_minutes === durationMinutes &&
                     tDescNormalized === descNormalized;
            });
            
            if (possibleDuplicate) {
              results.timeLogs.skipped++;
              console.log(`Skipping duplicate time log (date+desc match): ${dateClientKey}`);
              continue;
            }
          }

          // Calculate end_time from start_time + duration (duration_minutes is a generated column)
          const startDate = new Date(startTime);
          const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);
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

          const { error } = await supabase.from("time_entries").insert(timeEntryData);

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
      existingMeetings?.map(m => `${m.title}::${m.start_time}`) || []
    );

    // 4. Import Meetings
    if (backupData.Meeting && backupData.Meeting.length > 0) {
      console.log(`Processing ${backupData.Meeting.length} meetings...`);
      
      for (const meeting of backupData.Meeting) {
        try {
          const startTime = meeting.start_time || meeting.start_date || new Date().toISOString();
          const endTime = meeting.end_time || meeting.end_date || new Date(Date.now() + 3600000).toISOString();

          // Check for duplicates
          const meetingKey = `${meeting.title}::${startTime}`;
          if (existingMeetingSet.has(meetingKey)) {
            results.meetings.skipped++;
            continue;
          }

          const clientId = findClientId(meeting.client_id, meeting.client_name);

          // Map status
          let status = "scheduled";
          if (meeting.status === "הושלם" || meeting.status === "completed") status = "completed";
          else if (meeting.status === "בוטל" || meeting.status === "cancelled") status = "cancelled";

          const meetingData = {
            title: meeting.title || "פגישה",
            description: meeting.description || null,
            client_id: clientId,
            start_time: startTime,
            end_time: endTime,
            location: meeting.location || null,
            notes: meeting.notes || null,
            status,
            attendees: Array.isArray(meeting.attendees) ? meeting.attendees : [],
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
      
      const existingQuoteNumbers = new Set(existingQuotes?.map(q => q.quote_number) || []);
      
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
          if (quote.status === "אושר" || quote.status === "approved") status = "approved";
          else if (quote.status === "נשלח" || quote.status === "sent") status = "sent";
          else if (quote.status === "נדחה" || quote.status === "rejected") status = "rejected";

          const quoteData = {
            quote_number: quoteNumber,
            client_id: clientId,
            total: quote.amount || quote.total || 0,
            status,
            description: quote.description || quote.title || null,
            valid_until: quote.valid_until ? new Date(quote.valid_until).toISOString().split('T')[0] : null,
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
      
      const existingInvoiceNumbers = new Set(existingInvoices?.map(i => i.invoice_number) || []);
      
      for (const invoice of backupData.Invoice) {
        try {
          const clientId = findClientId(invoice.client_id, invoice.client_name);
          if (!clientId) {
            results.invoices.skipped++;
            continue;
          }

          const invoiceNumber = invoice.invoice_number || `INV-${invoice.id?.slice(-6) || Date.now().toString().slice(-6)}`;
          
          // Check for duplicates
          if (existingInvoiceNumbers.has(invoiceNumber)) {
            results.invoices.skipped++;
            continue;
          }

          // Map status
          let status = "draft";
          if (invoice.status === "שולם" || invoice.status === "paid") status = "paid";
          else if (invoice.status === "נשלח" || invoice.status === "sent") status = "sent";
          else if (invoice.status === "באיחור" || invoice.status === "overdue") status = "overdue";
          else if (invoice.status === "בוטל" || invoice.status === "cancelled") status = "cancelled";

          const invoiceData = {
            invoice_number: invoiceNumber,
            client_id: clientId,
            amount: invoice.amount || invoice.total || 0,
            status,
            description: invoice.description || null,
            issue_date: invoice.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            due_date: invoice.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : null,
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
        existingProjects?.map(p => `${p.name}::${p.client_id || 'null'}`) || []
      );
      
      for (const project of backupData.Project) {
        try {
          const clientId = findClientId(project.client_id, project.client_name);
          
          // Check for duplicates
          const projectKey = `${project.name}::${clientId || 'null'}`;
          if (existingProjectSet.has(projectKey)) {
            results.projects.skipped++;
            continue;
          }

          // Map status
          let status = "planning";
          if (project.status === "פעיל" || project.status === "active") status = "active";
          else if (project.status === "הושלם" || project.status === "completed") status = "completed";
          else if (project.status === "בהמתנה" || project.status === "on-hold") status = "on-hold";
          else if (project.status === "מבוטל" || project.status === "cancelled") status = "cancelled";

          const projectData = {
            name: project.name,
            description: project.description || null,
            client_id: clientId,
            status,
            priority: project.priority || "medium",
            start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : null,
            end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : null,
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

    // Import CustomSpreadsheets
    if (backupData.CustomSpreadsheet && backupData.CustomSpreadsheet.length > 0) {
      console.log(`Importing ${backupData.CustomSpreadsheet.length} custom spreadsheets...`);
      
      for (const spreadsheet of backupData.CustomSpreadsheet as BackupCustomSpreadsheet[]) {
        try {
          const spreadsheetData = {
            name: spreadsheet.name,
            description: spreadsheet.description || null,
            columns: spreadsheet.columns || [],
            rows: spreadsheet.rows || [],
            created_by: userId,
          };

          const { error } = await supabase.from("custom_spreadsheets").insert(spreadsheetData);

          if (error) {
            console.error(`Error inserting spreadsheet ${spreadsheet.name}:`, error);
            results.customSpreadsheets.errors++;
          } else {
            results.customSpreadsheets.imported++;
          }
        } catch (e) {
          console.error(`Exception inserting spreadsheet:`, e);
          results.customSpreadsheets.errors++;
        }
      }
    }

    // Import TeamMembers (Employees)
    if (backupData.TeamMember && backupData.TeamMember.length > 0) {
      console.log(`Importing ${backupData.TeamMember.length} team members...`);
      
      // Get existing employees to avoid duplicates
      const { data: existingEmployees } = await supabase
        .from("employees")
        .select("email");
      
      const existingEmails = new Set(existingEmployees?.map(e => e.email?.toLowerCase()) || []);
      
      for (const member of backupData.TeamMember as BackupTeamMember[]) {
        try {
          if (!member.email) {
            results.teamMembers.skipped++;
            continue;
          }

          const emailLower = member.email.toLowerCase();
          if (existingEmails.has(emailLower)) {
            results.teamMembers.skipped++;
            continue;
          }

          // Map role
          let role = "employee";
          if (member.role === "admin" || member.role === "מנהל") role = "admin";
          else if (member.role === "manager" || member.role === "מנהל צוות") role = "manager";

          const employeeData = {
            name: member.name || member.email,
            email: member.email,
            role,
            phone: member.phone || null,
            department: member.department || null,
            position: member.position || null,
          };

          const { error } = await supabase.from("employees").insert(employeeData);

          if (error) {
            console.error(`Error inserting team member ${member.email}:`, error);
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
      console.log(`Importing ${backupData.UserPreferences.length} user preferences...`);
      
      for (const pref of backupData.UserPreferences as BackupUserPreferences[]) {
        try {
          const prefData = {
            user_id: userId, // Use current user since we can't map old user IDs
            preferences: pref.preferences || {},
            theme: pref.theme || 'system',
            language: pref.language || 'he',
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

    console.log("Import completed:", results);

    const summary = {
      לקוחות: `${results.clients.imported} חדשים, ${results.clients.updated} עודכנו, ${results.clients.skipped} דולגו, ${results.clients.errors} שגיאות`,
      משימות: `${results.tasks.imported} חדשים, ${results.tasks.skipped} דולגו, ${results.tasks.errors} שגיאות`,
      רישומי_זמן: `${results.timeLogs.imported} חדשים, ${results.timeLogs.skipped} דולגו, ${results.timeLogs.errors} שגיאות`,
      פגישות: `${results.meetings.imported} חדשים, ${results.meetings.skipped} דולגו, ${results.meetings.errors} שגיאות`,
      הצעות_מחיר: `${results.quotes.imported} חדשים, ${results.quotes.skipped} דולגו, ${results.quotes.errors} שגיאות`,
      חשבוניות: `${results.invoices.imported} חדשים, ${results.invoices.skipped} דולגו, ${results.invoices.errors} שגיאות`,
      פרויקטים: `${results.projects.imported} חדשים, ${results.projects.skipped} דולגו, ${results.projects.errors} שגיאות`,
      טבלאות_מותאמות: `${results.customSpreadsheets.imported} חדשים, ${results.customSpreadsheets.skipped} דולגו, ${results.customSpreadsheets.errors} שגיאות`,
      עובדים: `${results.teamMembers.imported} חדשים, ${results.teamMembers.skipped} דולגו, ${results.teamMembers.errors} שגיאות`,
      העדפות_משתמשים: `${results.userPreferences.imported} חדשים, ${results.userPreferences.updated} עודכנו, ${results.userPreferences.errors} שגיאות`,
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        summary,
        message: `ייבוא הושלם בהצלחה!`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
