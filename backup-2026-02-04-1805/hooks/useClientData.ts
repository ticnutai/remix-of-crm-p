import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Activity logging helper function (no hooks)
const logToActivityLog = async (userId: string | undefined, action: string, entityType: string, entityId: string, details?: Record<string, any>) => {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
      ip_address: null,
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

// Types
export interface ClientDetails {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phone_secondary: string | null;
  company: string | null;
  address: string | null;
  status: string | null;
  stage: string | null;
  source: string | null;
  budget_range: string | null;
  preferred_contact: string | null;
  linkedin: string | null;
  website: string | null;
  whatsapp: string | null;
  notes: string | null;
  tags: string[] | null;
  // שדות נדל"ן
  id_number: string | null;
  gush: string | null;
  helka: string | null;
  migrash: string | null;
  taba: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientProject {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface ClientTimeEntry {
  id: string;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean | null;
  hourly_rate: number | null;
  project_id: string | null;
  project_name?: string;
  user_name?: string;
  created_at: string;
}

export interface ClientTask {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  completed_at: string | null;
  project_id: string | null;
  project_name?: string;
  assigned_to_name?: string;
  created_at: string;
}

export interface ClientMeeting {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_type: string | null;
  status: string | null;
  notes: string | null;
  project_id: string | null;
  project_name?: string;
  created_at: string;
}

export interface ClientFile {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  description: string | null;
  uploader_type: string;
  created_at: string;
}

export interface ClientMessage {
  id: string;
  message: string;
  sender_type: string;
  is_read: boolean | null;
  created_at: string;
}

export interface ClientReminder {
  id: string;
  title: string;
  message: string | null;
  remind_at: string;
  reminder_type: string;
  is_sent: boolean | null;
  is_dismissed: boolean | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string;
}

export interface ClientWhatsApp {
  id: string;
  phone_number: string;
  message: string;
  direction: string;
  status: string | null;
  created_at: string;
}

export interface ClientInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  status: string | null;
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  description: string | null;
  project_id: string | null;
  project_name?: string;
  created_at: string;
}

export interface ClientCustomRow {
  id: string;
  table_id: string;
  table_name: string;
  table_display_name: string;
  data: Record<string, any>;
  created_at: string;
}

// All tables containing the client (for the Tables tab)
export interface ClientTableEntry {
  tableName: string;          // Internal table name
  tableDisplayName: string;   // Display name in Hebrew
  columns: { key: string; label: string }[];  // Column definitions
  rows: Record<string, any>[];  // Rows where client appears
}

export interface ClientStats {
  totalProjects: number;
  activeProjects: number;
  totalHours: number;
  thisMonthHours: number;
  totalRevenue: number;
  pendingInvoices: number;
  openTasks: number;
  upcomingMeetings: number;
}

export function useClientData(clientId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [client, setClient] = useState<ClientDetails | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [timeEntries, setTimeEntries] = useState<ClientTimeEntry[]>([]);
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [meetings, setMeetings] = useState<ClientMeeting[]>([]);
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [reminders, setReminders] = useState<ClientReminder[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<ClientWhatsApp[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [customRows, setCustomRows] = useState<ClientCustomRow[]>([]);
  const [allClientTables, setAllClientTables] = useState<ClientTableEntry[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalProjects: 0,
    activeProjects: 0,
    totalHours: 0,
    thisMonthHours: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    openTasks: 0,
    upcomingMeetings: 0,
  });
  
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client details
  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (error) {
      console.error('Error fetching client:', error);
      return;
    }
    
    // Cast to ClientDetails with default values for new fields
    const clientData: ClientDetails = {
      ...data,
      id_number: data.id_number ?? null,
      gush: data.gush ?? null,
      helka: data.helka ?? null,
      migrash: data.migrash ?? null,
      taba: data.taba ?? null,
    };
    setClient(clientData);
  }, [clientId]);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }
    
    setProjects(data || []);
  }, [clientId]);

  // Fetch time entries
  const fetchTimeEntries = useCallback(async () => {
    if (!clientId) return;
    
    // Fetch time entries and projects separately (no FK on user_id to profiles)
    const [entriesRes, profilesRes] = await Promise.all([
      supabase
        .from('time_entries')
        .select(`
          *,
          projects:project_id(name)
        `)
        .eq('client_id', clientId)
        .order('start_time', { ascending: false }),
      supabase.from('profiles').select('id, full_name')
    ]);
    
    if (entriesRes.error) {
      console.error('Error fetching time entries:', entriesRes.error);
      return;
    }
    
    // Create a map of user_id to name for quick lookup
    const userMap = new Map<string, string>();
    (profilesRes.data || []).forEach(p => {
      userMap.set(p.id, p.full_name || 'לא ידוע');
    });
    
    setTimeEntries((entriesRes.data || []).map(entry => ({
      ...entry,
      project_name: (entry.projects as any)?.name,
      user_name: userMap.get(entry.user_id) || 'לא ידוע',
    })));
  }, [clientId]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!clientId) return;
    
    // Note: assigned_to doesn't have a foreign key to profiles, so we fetch separately
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects:project_id(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tasks:', error);
      return;
    }
    
    setTasks((data || []).map(task => ({
      ...task,
      project_name: (task.projects as any)?.name,
    })));
  }, [clientId]);

  // Fetch meetings
  const fetchMeetings = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        projects:project_id(name)
      `)
      .eq('client_id', clientId)
      .order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching meetings:', error);
      return;
    }
    
    setMeetings((data || []).map(meeting => ({
      ...meeting,
      project_name: (meeting.projects as any)?.name,
    })));
  }, [clientId]);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('client_files')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching files:', error);
      return;
    }
    
    setFiles(data || []);
  }, [clientId]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('client_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }
    
    setMessages(data || []);
  }, [clientId]);

  // Fetch reminders
  const fetchReminders = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('client_id', clientId)
      .order('remind_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reminders:', error);
      return;
    }
    
    setReminders(data || []);
  }, [clientId]);

  // Fetch WhatsApp messages
  const fetchWhatsApp = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching WhatsApp messages:', error);
      return;
    }
    
    setWhatsappMessages(data || []);
  }, [clientId]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    if (!clientId) return;
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        projects:project_id(name)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices:', error);
      return;
    }
    
    setInvoices((data || []).map(invoice => ({
      ...invoice,
      project_name: (invoice.projects as any)?.name,
    })));
  }, [clientId]);

  // Fetch custom table rows linked to this client
  const fetchCustomRows = useCallback(async () => {
    if (!clientId) return;
    
    const { data: tables, error: tablesError } = await supabase
      .from('custom_tables')
      .select('id, name, display_name');
    
    if (tablesError) {
      console.error('Error fetching custom tables:', tablesError);
      return;
    }
    
    const { data: rows, error: rowsError } = await supabase
      .from('custom_table_data')
      .select('*')
      .eq('linked_client_id', clientId);
    
    if (rowsError) {
      console.error('Error fetching custom rows:', rowsError);
      return;
    }
    
    const enrichedRows = (rows || []).map(row => {
      const table = tables?.find(t => t.id === row.table_id);
      return {
        ...row,
        table_name: table?.name || '',
        table_display_name: table?.display_name || '',
        data: row.data as Record<string, any>,
      };
    });
    
    setCustomRows(enrichedRows);
  }, [clientId]);

  // Fetch all tables where this client appears - for the "Tables" tab
  const fetchAllClientTables = useCallback(async () => {
    if (!clientId || !client) return;
    
    const tables: ClientTableEntry[] = [];
    
    // 1. Clients table - the client's own row
    tables.push({
      tableName: 'clients',
      tableDisplayName: 'לקוחות',
      columns: [
        { key: 'name', label: 'שם' },
        { key: 'company', label: 'חברה' },
        { key: 'email', label: 'אימייל' },
        { key: 'phone', label: 'טלפון' },
        { key: 'address', label: 'כתובת' },
        { key: 'status', label: 'סטטוס' },
        { key: 'stage', label: 'שלב' },
        { key: 'source', label: 'מקור' },
        { key: 'notes', label: 'הערות' },
      ],
      rows: [client],
    });
    
    // 2. Projects table
    if (projects.length > 0) {
      tables.push({
        tableName: 'projects',
        tableDisplayName: 'פרויקטים',
        columns: [
          { key: 'name', label: 'שם פרויקט' },
          { key: 'status', label: 'סטטוס' },
          { key: 'priority', label: 'עדיפות' },
          { key: 'budget', label: 'תקציב' },
          { key: 'start_date', label: 'תאריך התחלה' },
          { key: 'end_date', label: 'תאריך סיום' },
          { key: 'description', label: 'תיאור' },
        ],
        rows: projects,
      });
    }
    
    // 3. Invoices table
    if (invoices.length > 0) {
      tables.push({
        tableName: 'invoices',
        tableDisplayName: 'חשבוניות',
        columns: [
          { key: 'invoice_number', label: 'מספר חשבונית' },
          { key: 'amount', label: 'סכום' },
          { key: 'status', label: 'סטטוס' },
          { key: 'issue_date', label: 'תאריך הנפקה' },
          { key: 'due_date', label: 'תאריך פירעון' },
          { key: 'description', label: 'תיאור' },
        ],
        rows: invoices,
      });
    }
    
    // 4. Tasks table
    if (tasks.length > 0) {
      tables.push({
        tableName: 'tasks',
        tableDisplayName: 'משימות',
        columns: [
          { key: 'title', label: 'כותרת' },
          { key: 'status', label: 'סטטוס' },
          { key: 'priority', label: 'עדיפות' },
          { key: 'due_date', label: 'תאריך יעד' },
          { key: 'description', label: 'תיאור' },
        ],
        rows: tasks,
      });
    }
    
    // 5. Time entries table
    if (timeEntries.length > 0) {
      tables.push({
        tableName: 'time_entries',
        tableDisplayName: 'לוגי זמן',
        columns: [
          { key: 'description', label: 'תיאור' },
          { key: 'start_time', label: 'שעת התחלה' },
          { key: 'end_time', label: 'שעת סיום' },
          { key: 'duration_minutes', label: 'משך (דקות)' },
          { key: 'is_billable', label: 'לחיוב' },
          { key: 'project_name', label: 'פרויקט' },
        ],
        rows: timeEntries,
      });
    }
    
    // 6. Meetings table
    if (meetings.length > 0) {
      tables.push({
        tableName: 'meetings',
        tableDisplayName: 'פגישות',
        columns: [
          { key: 'title', label: 'כותרת' },
          { key: 'start_time', label: 'מועד' },
          { key: 'location', label: 'מיקום' },
          { key: 'meeting_type', label: 'סוג' },
          { key: 'status', label: 'סטטוס' },
        ],
        rows: meetings,
      });
    }
    
    // 7. Custom tables
    if (customRows.length > 0) {
      // Group by table
      const tableGroups = new Map<string, { displayName: string; rows: Record<string, any>[] }>();
      
      customRows.forEach(row => {
        if (!tableGroups.has(row.table_id)) {
          tableGroups.set(row.table_id, {
            displayName: row.table_display_name,
            rows: [],
          });
        }
        tableGroups.get(row.table_id)!.rows.push({ ...row.data, id: row.id, created_at: row.created_at });
      });
      
      // Fetch columns for each custom table
      for (const [tableId, group] of tableGroups) {
        const { data: tableData } = await supabase
          .from('custom_tables')
          .select('columns')
          .eq('id', tableId)
          .single();
        
        const columns = (tableData?.columns as any[] || []).map((col: any) => ({
          key: col.key || col.name,
          label: col.name || col.key,
        }));
        
        tables.push({
          tableName: `custom_${tableId}`,
          tableDisplayName: group.displayName,
          columns,
          rows: group.rows,
        });
      }
    }
    
    setAllClientTables(tables);
  }, [clientId, client, projects, invoices, tasks, timeEntries, meetings, customRows]);

  // Calculate stats
  const calculateStats = useCallback(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    
    const totalMinutes = timeEntries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    const thisMonthMinutes = timeEntries
      .filter(entry => new Date(entry.start_time) >= startOfMonth)
      .reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
    
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length;
    
    const openTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length;
    
    const upcomingMeetings = meetings.filter(m => new Date(m.start_time) >= now).length;
    
    setStats({
      totalProjects: projects.length,
      activeProjects,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      thisMonthHours: Math.round(thisMonthMinutes / 60 * 10) / 10,
      totalRevenue,
      pendingInvoices,
      openTasks,
      upcomingMeetings,
    });
  }, [projects, timeEntries, tasks, meetings, invoices]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    if (!clientId || !user) return;
    
    setIsLoading(true);
    
    await Promise.all([
      fetchClient(),
      fetchProjects(),
      fetchTimeEntries(),
      fetchTasks(),
      fetchMeetings(),
      fetchFiles(),
      fetchMessages(),
      fetchReminders(),
      fetchWhatsApp(),
      fetchInvoices(),
      fetchCustomRows(),
    ]);
    
    setIsLoading(false);
  }, [clientId, user, fetchClient, fetchProjects, fetchTimeEntries, fetchTasks, fetchMeetings, fetchFiles, fetchMessages, fetchReminders, fetchWhatsApp, fetchInvoices, fetchCustomRows]);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate stats when data changes
  useEffect(() => {
    calculateStats();
  }, [calculateStats]);

  // Build allClientTables when data is loaded
  useEffect(() => {
    if (client) {
      fetchAllClientTables();
    }
  }, [client, fetchAllClientTables]);

  // Real-time subscriptions
  useEffect(() => {
    if (!clientId || !user) return;

    const channels: ReturnType<typeof supabase.channel>[] = [];

    // Subscribe to projects changes
    const projectsChannel = supabase
      .channel(`client-projects-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `client_id=eq.${clientId}` }, () => fetchProjects())
      .subscribe();
    channels.push(projectsChannel);

    // Subscribe to time entries changes
    const timeEntriesChannel = supabase
      .channel(`client-time-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_entries', filter: `client_id=eq.${clientId}` }, () => fetchTimeEntries())
      .subscribe();
    channels.push(timeEntriesChannel);

    // Subscribe to tasks changes
    const tasksChannel = supabase
      .channel(`client-tasks-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `client_id=eq.${clientId}` }, () => fetchTasks())
      .subscribe();
    channels.push(tasksChannel);

    // Subscribe to meetings changes
    const meetingsChannel = supabase
      .channel(`client-meetings-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings', filter: `client_id=eq.${clientId}` }, () => fetchMeetings())
      .subscribe();
    channels.push(meetingsChannel);

    // Subscribe to files changes
    const filesChannel = supabase
      .channel(`client-files-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_files', filter: `client_id=eq.${clientId}` }, () => fetchFiles())
      .subscribe();
    channels.push(filesChannel);

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel(`client-messages-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_messages', filter: `client_id=eq.${clientId}` }, () => fetchMessages())
      .subscribe();
    channels.push(messagesChannel);

    // Subscribe to invoices changes
    const invoicesChannel = supabase
      .channel(`client-invoices-${clientId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `client_id=eq.${clientId}` }, () => fetchInvoices())
      .subscribe();
    channels.push(invoicesChannel);

    // Cleanup
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [clientId, user, fetchProjects, fetchTimeEntries, fetchTasks, fetchMeetings, fetchFiles, fetchMessages, fetchInvoices]);

  // CRUD operations
  const updateClient = useCallback(async (updates: Partial<ClientDetails>) => {
    if (!clientId) return false;
    
    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);
    
    if (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את הלקוח', variant: 'destructive' });
      return false;
    }
    
    logToActivityLog(user?.id, 'update', 'clients', clientId, { changes: updates });
    await fetchClient();
    toast({ title: 'עודכן בהצלחה' });
    return true;
  }, [clientId, fetchClient, toast]);

  const addWhatsAppMessage = useCallback(async (phone: string, message: string) => {
    if (!clientId || !user) return false;
    
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        client_id: clientId,
        phone_number: phone,
        message,
        direction: 'outgoing',
        sent_by: user.id,
      });
    
    if (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לשמור את ההודעה', variant: 'destructive' });
      return false;
    }
    
    await fetchWhatsApp();
    return true;
  }, [clientId, user, fetchWhatsApp, toast]);

  const addInvoice = useCallback(async (invoice: {
    invoice_number: string;
    amount: number;
    issue_date: string;
    due_date?: string;
    description?: string;
    project_id?: string;
  }) => {
    if (!clientId || !user) return false;
    
    const { error } = await supabase
      .from('invoices')
      .insert({
        ...invoice,
        client_id: clientId,
        created_by: user.id,
      });
    
    if (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן ליצור חשבונית', variant: 'destructive' });
      return false;
    }
    
    await fetchInvoices();
    toast({ title: 'חשבונית נוצרה בהצלחה' });
    return true;
  }, [clientId, user, fetchInvoices, toast]);

  const updateInvoiceStatus = useCallback(async (invoiceId: string, status: string, paidDate?: string) => {
    const updates: any = { status };
    if (paidDate) updates.paid_date = paidDate;
    
    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);
    
    if (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לעדכן את החשבונית', variant: 'destructive' });
      return false;
    }
    
    await fetchInvoices();
    return true;
  }, [fetchInvoices, toast]);

  return {
    client,
    projects,
    timeEntries,
    tasks,
    meetings,
    files,
    messages,
    reminders,
    whatsappMessages,
    invoices,
    customRows,
    allClientTables,
    stats,
    isLoading,
    refresh: fetchAllData,
    updateClient,
    addWhatsAppMessage,
    addInvoice,
    updateInvoiceStatus,
  };
}
