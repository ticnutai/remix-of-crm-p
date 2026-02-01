/**
 * AI Chat Service - שירות צ'אט AI חכם
 * מחובר לכל הנתונים במערכת ויכול לשלוף מידע מהר
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any; // נתונים נוספים שהצ'אט שלף
}

export interface DataContext {
  clients: any[];
  projects: any[];
  timeEntries: any[];
  tasks: any[];
  meetings: any[];
  quotes: any[];
  invoices: any[];
  contracts: any[];
}

class AIChatService {
  private context: Partial<DataContext> = {};
  private initialized = false;

  /**
   * אתחול - טעינת כל הנתונים מהמערכת
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🤖 Loading all data for AI chat...');

      // טעינה מקבילית של כל הנתונים
      const [
        clientsData,
        projectsData,
        timeEntriesData,
        tasksData,
        meetingsData,
        quotesData,
        invoicesData,
        contractsData,
      ] = await Promise.all([
        supabase.from('clients').select('*').limit(1000),
        supabase.from('projects').select('*').limit(1000),
        supabase.from('time_entries').select('*').limit(5000),
        supabase.from('tasks').select('*').limit(2000),
        supabase.from('meetings').select('*').limit(1000),
        supabase.from('quotes').select('*').limit(1000),
        supabase.from('invoices').select('*').limit(1000),
        supabase.from('contracts').select('*').limit(500),
      ]);

      this.context = {
        clients: clientsData.data || [],
        projects: projectsData.data || [],
        timeEntries: timeEntriesData.data || [],
        tasks: tasksData.data || [],
        meetings: meetingsData.data || [],
        quotes: quotesData.data || [],
        invoices: invoicesData.data || [],
        contracts: contractsData.data || [],
      };

      this.initialized = true;
      console.log('✅ AI Chat initialized with full context');
    } catch (error) {
      console.error('❌ Failed to initialize AI Chat:', error);
    }
  }

  /**
   * עיבוד שאלה וחיפוש תשובה
   */
  async processQuery(query: string): Promise<ChatMessage> {
    await this.initialize();

    const lowerQuery = query.toLowerCase();
    
    // זיהוי כוונת השאלה
    const intent = this.detectIntent(lowerQuery);
    
    let response: string;
    let data: any = null;

    switch (intent.type) {
      case 'client-search':
        response = await this.searchClients(intent.params);
        break;
      case 'client-stats':
        response = await this.getClientStats();
        break;
      case 'project-search':
        response = await this.searchProjects(intent.params);
        break;
      case 'time-summary':
        response = await this.getTimeSummary(intent.params);
        break;
      case 'revenue-report':
        response = await this.getRevenueReport(intent.params);
        break;
      case 'task-list':
        response = await this.getTasks(intent.params);
        break;
      case 'overdue-tasks':
        response = await this.getOverdueTasks();
        break;
      case 'upcoming-meetings':
        response = await this.getUpcomingMeetings(intent.params);
        break;
      case 'quote-status':
        response = await this.getQuoteStatus(intent.params);
        break;
      case 'invoice-summary':
        response = await this.getInvoiceSummary();
        break;
      case 'top-clients':
        response = await this.getTopClients(intent.params);
        break;
      default:
        response = this.handleGeneralQuery(lowerQuery);
    }

    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      data,
    };
  }

  /**
   * זיהוי כוונת השאלה
   */
  private detectIntent(query: string): { type: string; params: any } {
    // חיפוש לקוח
    if (query.includes('לקוח') || query.includes('מצא') && query.includes('שם')) {
      return { type: 'client-search', params: { query } };
    }

    // סטטיסטיקות לקוחות
    if (query.includes('כמה לקוחות') || query.includes('סה"כ לקוחות')) {
      return { type: 'client-stats', params: {} };
    }

    // חיפוש פרויקט
    if (query.includes('פרויקט') || query.includes('פרוייקט')) {
      return { type: 'project-search', params: { query } };
    }

    // סיכום זמנים
    if (query.includes('שעות') || query.includes('זמן') && (query.includes('היום') || query.includes('השבוע') || query.includes('החודש'))) {
      return { type: 'time-summary', params: { period: this.extractPeriod(query) } };
    }

    // דוח הכנסות
    if (query.includes('הכנסות') || query.includes('רווח') || query.includes('כסף')) {
      return { type: 'revenue-report', params: { period: this.extractPeriod(query) } };
    }

    // משימות
    if (query.includes('משימ') && !query.includes('באיחור')) {
      return { type: 'task-list', params: { status: this.extractTaskStatus(query) } };
    }

    // משימות באיחור
    if (query.includes('משימ') && query.includes('באיחור')) {
      return { type: 'overdue-tasks', params: {} };
    }

    // פגישות קרובות
    if (query.includes('פגיש')) {
      return { type: 'upcoming-meetings', params: { days: this.extractDays(query) } };
    }

    // הצעות מחיר
    if (query.includes('הצע')) {
      return { type: 'quote-status', params: {} };
    }

    // חשבוניות
    if (query.includes('חשבונ')) {
      return { type: 'invoice-summary', params: {} };
    }

    // לקוחות מובילים
    if (query.includes('לקוחות הכי') || query.includes('לקוחות טוב')) {
      return { type: 'top-clients', params: { limit: 10 } };
    }

    return { type: 'general', params: { query } };
  }

  /**
   * חיפוש לקוחות
   */
  private async searchClients(params: any): Promise<string> {
    const { query } = params;
    const searchTerm = query.replace(/לקוח|מצא|חפש|בשם/g, '').trim();

    if (!searchTerm) {
      return `יש ${this.context.clients?.length || 0} לקוחות במערכת. מה תרצה לדעת עליהם?`;
    }

    const found = this.context.clients?.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (found.length === 0) {
      return `לא מצאתי לקוח עם השם "${searchTerm}" 😕`;
    }

    if (found.length === 1) {
      const client = found[0];
      return `מצאתי! 🎯\n\n**${client.name}**\n- חברה: ${client.company || 'לא צוין'}\n- אימייל: ${client.email || 'לא צוין'}\n- טלפון: ${client.phone || 'לא צוין'}\n- סטטוס: ${client.status || 'לא צוין'}\n- נוצר: ${new Date(client.created_at).toLocaleDateString('he-IL')}`;
    }

    const list = found.slice(0, 5).map(c => `• ${c.name} (${c.company || 'ללא חברה'})`).join('\n');
    return `מצאתי ${found.length} לקוחות:\n\n${list}${found.length > 5 ? '\n\n...ועוד ' + (found.length - 5) : ''}`;
  }

  /**
   * סטטיסטיקות לקוחות
   */
  private async getClientStats(): Promise<string> {
    const clients = this.context.clients || [];
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const pending = clients.filter(c => c.status === 'pending').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;

    return `📊 סטטיסטיקות לקוחות:\n\n• סה"כ: **${total}**\n• פעילים: **${active}** (${Math.round(active/total*100)}%)\n• ממתינים: **${pending}** (${Math.round(pending/total*100)}%)\n• לא פעילים: **${inactive}** (${Math.round(inactive/total*100)}%)`;
  }

  /**
   * חיפוש פרויקטים
   */
  private async searchProjects(params: any): Promise<string> {
    const projects = this.context.projects || [];
    const active = projects.filter(p => p.status === 'active');

    return `🏗️ יש ${projects.length} פרויקטים במערכת:\n• ${active.length} פעילים\n• ${projects.length - active.length} לא פעילים`;
  }

  /**
   * סיכום זמנים
   */
  private async getTimeSummary(params: any): Promise<string> {
    const entries = this.context.timeEntries || [];
    const { period = 'today' } = params;

    let filtered = entries;
    const now = new Date();

    if (period === 'today') {
      filtered = entries.filter(e => {
        const entryDate = new Date(e.start_time);
        return entryDate.toDateString() === now.toDateString();
      });
    } else if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = entries.filter(e => new Date(e.start_time) >= weekAgo);
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = entries.filter(e => new Date(e.start_time) >= monthAgo);
    }

    const totalMinutes = filtered.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const periodText = period === 'today' ? 'היום' : period === 'week' ? 'השבוע' : 'החודש';
    return `⏱️ סיכום זמנים ${periodText}:\n\n• סה"כ שעות: **${totalHours}**\n• רישומים: **${filtered.length}**`;
  }

  /**
   * דוח הכנסות
   */
  private async getRevenueReport(params: any): Promise<string> {
    const invoices = this.context.invoices || [];
    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');

    const totalPaid = paid.reduce((sum, i) => sum + (i.total_amount || 0), 0);
    const totalPending = pending.reduce((sum, i) => sum + (i.total_amount || 0), 0);

    return `💰 דוח הכנסות:\n\n• שולם: **₪${totalPaid.toLocaleString()}** (${paid.length} חשבוניות)\n• ממתין: **₪${totalPending.toLocaleString()}** (${pending.length} חשבוניות)\n• סה"כ: **₪${(totalPaid + totalPending).toLocaleString()}**`;
  }

  /**
   * רשימת משימות
   */
  private async getTasks(params: any): Promise<string> {
    const tasks = this.context.tasks || [];
    const { status } = params;

    if (status === 'pending') {
      const pending = tasks.filter(t => t.status !== 'completed');
      return `📋 יש **${pending.length}** משימות פתוחות`;
    }

    return `📋 יש **${tasks.length}** משימות במערכת`;
  }

  /**
   * משימות באיחור
   */
  private async getOverdueTasks(): Promise<string> {
    const tasks = this.context.tasks || [];
    const now = new Date();

    const overdue = tasks.filter(t =>
      t.status !== 'completed' &&
      t.due_date &&
      new Date(t.due_date) < now
    );

    if (overdue.length === 0) {
      return `✅ מעולה! אין משימות באיחור`;
    }

    const list = overdue.slice(0, 5).map(t =>
      `• ${t.title} (${new Date(t.due_date).toLocaleDateString('he-IL')})`
    ).join('\n');

    return `⚠️ יש **${overdue.length}** משימות באיחור:\n\n${list}${overdue.length > 5 ? '\n\n...ועוד ' + (overdue.length - 5) : ''}`;
  }

  /**
   * פגישות קרובות
   */
  private async getUpcomingMeetings(params: any): Promise<string> {
    const meetings = this.context.meetings || [];
    const { days = 7 } = params;
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const upcoming = meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= now && meetingDate <= future;
    });

    if (upcoming.length === 0) {
      return `📅 אין פגישות ב-${days} הימים הקרובים`;
    }

    const list = upcoming.slice(0, 5).map(m =>
      `• ${m.title} - ${new Date(m.scheduled_at).toLocaleDateString('he-IL')}`
    ).join('\n');

    return `📅 יש **${upcoming.length}** פגישות ב-${days} הימים הקרובים:\n\n${list}`;
  }

  /**
   * סטטוס הצעות מחיר
   */
  private async getQuoteStatus(params: any): Promise<string> {
    const quotes = this.context.quotes || [];
    const pending = quotes.filter(q => q.status === 'pending');
    const accepted = quotes.filter(q => q.status === 'accepted');
    const rejected = quotes.filter(q => q.status === 'rejected');

    return `📝 הצעות מחיר:\n\n• סה"כ: **${quotes.length}**\n• ממתינות: **${pending.length}**\n• אושרו: **${accepted.length}**\n• נדחו: **${rejected.length}**`;
  }

  /**
   * סיכום חשבוניות
   */
  private async getInvoiceSummary(): Promise<string> {
    const invoices = this.context.invoices || [];
    const paid = invoices.filter(i => i.status === 'paid').length;
    const pending = invoices.filter(i => i.status === 'pending').length;
    const overdue = invoices.filter(i =>
      i.status === 'pending' && i.due_date && new Date(i.due_date) < new Date()
    ).length;

    return `🧾 חשבוניות:\n\n• סה"כ: **${invoices.length}**\n• שולם: **${paid}** ✅\n• ממתין: **${pending}**\n• באיחור: **${overdue}** ⚠️`;
  }

  /**
   * לקוחות מובילים
   */
  private async getTopClients(params: any): Promise<string> {
    const { limit = 5 } = params;
    // כאן אפשר לחשב לפי הכנסות, פרויקטים, וכו'
    const clients = this.context.clients?.slice(0, limit) || [];
    
    const list = clients.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
    return `🏆 ${limit} לקוחות מובילים:\n\n${list}`;
  }

  /**
   * טיפול בשאלה כללית
   */
  private handleGeneralQuery(query: string): string {
    if (query.includes('שלום') || query.includes('היי') || query.includes('הי')) {
      return `שלום! 👋 אני הצ'אט החכם של המערכת. אני יכול לעזור לך למצוא מידע מהר!\n\nנסה לשאול:\n• "כמה לקוחות יש?"\n• "כמה שעות עבדתי היום?"\n• "מה ההכנסות החודש?"\n• "יש משימות באיחור?"\n• "פגישות השבוע?"`;
    }

    if (query.includes('תודה')) {
      return `בכיף! תמיד פה לעזור 😊`;
    }

    if (query.includes('עזרה') || query.includes('מה אתה יכול')) {
      return `אני יכול לעזור לך עם:\n\n✅ חיפוש לקוחות ופרויקטים\n✅ סיכומי זמנים והכנסות\n✅ משימות ופגישות\n✅ הצעות מחיר וחשבוניות\n✅ סטטיסטיקות ודוחות\n\nפשוט שאל מה שבא לך!`;
    }

    return `לא בטוח שהבנתי 🤔\n\nנסה לשאול משהו אחר, למשל:\n• "כמה לקוחות יש?"\n• "מה ההכנסות החודש?"\n• "יש משימות באיחור?"`;
  }

  /**
   * פונקציות עזר
   */
  private extractPeriod(query: string): string {
    if (query.includes('היום')) return 'today';
    if (query.includes('השבוע')) return 'week';
    if (query.includes('החודש')) return 'month';
    return 'today';
  }

  private extractTaskStatus(query: string): string {
    if (query.includes('פתוח') || query.includes('ממתין')) return 'pending';
    if (query.includes('סגור') || query.includes('הושלם')) return 'completed';
    return 'all';
  }

  private extractDays(query: string): number {
    const match = query.match(/(\d+)/);
    return match ? parseInt(match[1]) : 7;
  }
}

export const aiChatService = new AIChatService();
