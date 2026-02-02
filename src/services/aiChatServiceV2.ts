/**
 * AI Chat Service V2 - שירות צ'אט AI חכם ומשודרג
 * מבוסס על NLP פשוט עם זיהוי כוונות מתקדם
 */

import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  suggestions?: string[];
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
  employees: any[];
}

// מילון מילים נרדפות בעברית
const SYNONYMS: Record<string, string[]> = {
  'לקוח': ['לקוחות', 'קליינט', 'קליינטים', 'customer', 'client'],
  'פרויקט': ['פרויקטים', 'פרוייקט', 'פרוייקטים', 'project', 'projects'],
  'משימה': ['משימות', 'task', 'tasks', 'מטלה', 'מטלות'],
  'פגישה': ['פגישות', 'meeting', 'meetings', 'ישיבה', 'ישיבות'],
  'שעות': ['שעה', 'זמן', 'עבודה', 'hours', 'time'],
  'הכנסות': ['הכנסה', 'כסף', 'רווח', 'תשלום', 'revenue', 'income'],
  'הצעה': ['הצעות', 'הצעת מחיר', 'quote', 'quotes'],
  'חשבונית': ['חשבוניות', 'invoice', 'invoices'],
  'עובד': ['עובדים', 'צוות', 'employee', 'employees'],
  'כמה': ['מספר', 'סכום', 'כמות', 'how many', 'count'],
  'היום': ['today', 'עכשיו'],
  'השבוע': ['week', 'שבוע'],
  'החודש': ['month', 'חודש'],
  'באיחור': ['מאחר', 'איחור', 'overdue', 'late'],
};

// מילות שאלה
const QUESTION_WORDS = ['כמה', 'מה', 'מי', 'איפה', 'מתי', 'למה', 'האם', 'איזה', 'אילו'];

// מילות פעולה
const ACTION_WORDS = ['הראה', 'תן', 'מצא', 'חפש', 'סכם', 'ספר', 'רשום', 'הצג'];

class AIChatServiceV2 {
  private context: Partial<DataContext> = {};
  private initialized = false;
  private lastQuery = '';
  private readonly conversationHistory: ChatMessage[] = [];

  /**
   * אתחול - טעינת כל הנתונים מהמערכת
   */
  async initialize() {
    if (this.initialized) return;

    try {
      console.log('🤖 AI Chat V2 - Loading data...');

      const [
        clientsData,
        projectsData,
        timeEntriesData,
        tasksData,
        meetingsData,
        quotesData,
        invoicesData,
        contractsData,
        employeesData,
      ] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('time_entries').select('*').order('date', { ascending: false }).limit(5000),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(2000),
        supabase.from('meetings').select('*').order('scheduled_at', { ascending: false }).limit(1000),
        supabase.from('quotes').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('contracts').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('employees').select('*').limit(100),
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
        employees: employeesData.data || [],
      };

      this.initialized = true;
      console.log('✅ AI Chat V2 ready!', {
        clients: this.context.clients?.length,
        projects: this.context.projects?.length,
        tasks: this.context.tasks?.length,
      });
    } catch (error) {
      console.error('❌ AI Chat V2 init failed:', error);
    }
  }

  /**
   * רענון נתונים
   */
  async refresh() {
    this.initialized = false;
    await this.initialize();
  }

  /**
   * עיבוד שאלה ראשי
   */
  async processQuery(query: string): Promise<ChatMessage> {
    await this.initialize();
    this.lastQuery = query;

    const normalizedQuery = this.normalizeQuery(query);
    const intent = this.detectIntent(normalizedQuery);
    
    console.log('🎯 Detected intent:', intent);

    let response: string;
    let suggestions: string[] = [];

    try {
      switch (intent.type) {
        // === לקוחות ===
        case 'client-count':
        case 'client-stats':
          response = this.getClientStats();
          suggestions = ['הראה רשימת לקוחות', 'לקוחות פעילים', 'לקוח חדש היום'];
          break;
        case 'client-search':
          response = this.searchClients(intent.params.searchTerm);
          suggestions = ['כמה לקוחות יש?', 'לקוחות פעילים'];
          break;
        case 'client-list':
          response = this.getClientList(intent.params);
          suggestions = ['כמה לקוחות יש?', 'לקוחות לא פעילים'];
          break;

        // === פרויקטים ===
        case 'project-count':
        case 'project-stats':
          response = this.getProjectStats();
          suggestions = ['פרויקטים פעילים', 'פרויקטים שהושלמו'];
          break;
        case 'project-search':
          response = this.searchProjects(intent.params.searchTerm);
          break;
        case 'project-list':
          response = this.getProjectList(intent.params);
          break;

        // === משימות ===
        case 'task-count':
        case 'task-stats':
          response = this.getTaskStats();
          suggestions = ['משימות באיחור', 'משימות להיום'];
          break;
        case 'task-overdue':
          response = this.getOverdueTasks();
          suggestions = ['כל המשימות', 'משימות לשבוע'];
          break;
        case 'task-today':
          response = this.getTodayTasks();
          break;
        case 'task-list':
          response = this.getTaskList(intent.params);
          break;

        // === זמנים ושעות ===
        case 'time-today':
          response = this.getTimeToday();
          suggestions = ['שעות השבוע', 'שעות החודש'];
          break;
        case 'time-week':
          response = this.getTimeWeek();
          suggestions = ['שעות היום', 'שעות החודש'];
          break;
        case 'time-month':
          response = this.getTimeMonth();
          suggestions = ['שעות היום', 'שעות השבוע'];
          break;
        case 'time-stats':
          response = this.getTimeStats(intent.params);
          break;

        // === פגישות ===
        case 'meeting-today':
          response = this.getMeetingsToday();
          suggestions = ['פגישות השבוע', 'פגישות החודש'];
          break;
        case 'meeting-week':
          response = this.getMeetingsWeek();
          break;
        case 'meeting-upcoming':
          response = this.getUpcomingMeetings(intent.params.days || 7);
          break;
        case 'meeting-stats':
          response = this.getMeetingStats();
          break;

        // === הכנסות ===
        case 'revenue-today':
        case 'revenue-month':
        case 'revenue-stats':
          response = this.getRevenueStats(intent.params);
          suggestions = ['הצעות מחיר', 'חשבוניות'];
          break;

        // === הצעות מחיר ===
        case 'quote-stats':
          response = this.getQuoteStats();
          suggestions = ['הצעות ממתינות', 'הצעות שאושרו'];
          break;
        case 'quote-pending':
          response = this.getPendingQuotes();
          break;

        // === חשבוניות ===
        case 'invoice-stats':
          response = this.getInvoiceStats();
          suggestions = ['חשבוניות לא שולמו', 'חשבוניות החודש'];
          break;
        case 'invoice-unpaid':
          response = this.getUnpaidInvoices();
          break;

        // === עובדים ===
        case 'employee-count':
        case 'employee-stats':
          response = this.getEmployeeStats();
          break;

        // === סיכום כללי ===
        case 'summary':
        case 'dashboard':
          response = this.getDashboardSummary();
          suggestions = ['לקוחות', 'משימות', 'פגישות היום'];
          break;

        // === ברכות ושיחה ===
        case 'greeting':
          response = this.getGreeting();
          suggestions = ['כמה לקוחות יש?', 'משימות להיום', 'סיכום'];
          break;
        case 'thanks':
          response = this.getThanks();
          break;
        case 'help':
          response = this.getHelp();
          suggestions = ['סיכום', 'לקוחות', 'משימות'];
          break;

        default:
          response = this.handleUnknown(query);
          suggestions = ['עזרה', 'סיכום', 'כמה לקוחות יש?'];
      }
    } catch (error) {
      console.error('Error processing query:', error);
      response = '😕 אופס, משהו השתבש. נסה שוב.';
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      suggestions,
    };

    this.conversationHistory.push(message);
    return message;
  }

  /**
   * נרמול שאילתה - המרה לאותיות קטנות והסרת תווים מיוחדים
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[?!.,;:'"]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * בדיקה האם מילה מופיעה בשאילתה (כולל נרדפות)
   */
  private hasWord(query: string, word: string): boolean {
    const synonyms = SYNONYMS[word] || [];
    const allWords = [word, ...synonyms];
    return allWords.some(w => query.includes(w));
  }

  /**
   * זיהוי כוונה מתקדם
   */
  private detectIntent(query: string): { type: string; params: any } {
    // === ברכות ושיחה ===
    if (/^(שלום|היי|הי|בוקר טוב|ערב טוב|מה נשמע|מה קורה|hello|hi)/.test(query)) {
      return { type: 'greeting', params: {} };
    }
    if (/^(תודה|thanks|thank you|מעולה|אחלה)/.test(query)) {
      return { type: 'thanks', params: {} };
    }
    if (this.hasWord(query, 'עזרה') || query.includes('מה אתה יכול') || query.includes('איך להשתמש')) {
      return { type: 'help', params: {} };
    }

    // === סיכום / דשבורד ===
    if (query.includes('סיכום') || query.includes('דשבורד') || query.includes('מצב המערכת') || query.includes('סטטוס כללי')) {
      return { type: 'summary', params: {} };
    }

    // === לקוחות ===
    if (this.hasWord(query, 'לקוח')) {
      // כמה לקוחות
      if (this.hasWord(query, 'כמה') || query.includes('מספר') || query.includes('סהכ') || query.includes('סה"כ') || query.includes('יש')) {
        return { type: 'client-count', params: {} };
      }
      // חיפוש לקוח ספציפי
      if (query.includes('מצא') || query.includes('חפש') || query.includes('בשם')) {
        const searchTerm = this.extractSearchTerm(query, ['לקוח', 'מצא', 'חפש', 'בשם', 'את', 'ה']);
        if (searchTerm.length > 1) {
          return { type: 'client-search', params: { searchTerm } };
        }
      }
      // רשימת לקוחות
      if (query.includes('רשימ') || query.includes('הראה') || query.includes('הצג')) {
        const status = query.includes('פעיל') ? 'active' : query.includes('לא פעיל') ? 'inactive' : 'all';
        return { type: 'client-list', params: { status } };
      }
      // ברירת מחדל - סטטיסטיקות
      return { type: 'client-stats', params: {} };
    }

    // === פרויקטים ===
    if (this.hasWord(query, 'פרויקט')) {
      if (this.hasWord(query, 'כמה') || query.includes('יש') || query.includes('מספר')) {
        return { type: 'project-count', params: {} };
      }
      if (query.includes('פעיל')) {
        return { type: 'project-list', params: { status: 'active' } };
      }
      if (query.includes('הושלמ') || query.includes('סיים')) {
        return { type: 'project-list', params: { status: 'completed' } };
      }
      return { type: 'project-stats', params: {} };
    }

    // === משימות ===
    if (this.hasWord(query, 'משימה')) {
      if (this.hasWord(query, 'באיחור') || query.includes('מאחר') || query.includes('overdue')) {
        return { type: 'task-overdue', params: {} };
      }
      if (this.hasWord(query, 'היום') || query.includes('today')) {
        return { type: 'task-today', params: {} };
      }
      if (this.hasWord(query, 'כמה') || query.includes('יש') || query.includes('מספר')) {
        return { type: 'task-count', params: {} };
      }
      return { type: 'task-stats', params: {} };
    }

    // === שעות וזמנים ===
    if (this.hasWord(query, 'שעות') || query.includes('עבדתי') || query.includes('זמן עבודה')) {
      if (this.hasWord(query, 'היום') || query.includes('today')) {
        return { type: 'time-today', params: {} };
      }
      if (this.hasWord(query, 'השבוע') || query.includes('week')) {
        return { type: 'time-week', params: {} };
      }
      if (this.hasWord(query, 'החודש') || query.includes('month')) {
        return { type: 'time-month', params: {} };
      }
      return { type: 'time-today', params: {} };
    }

    // === פגישות ===
    if (this.hasWord(query, 'פגישה')) {
      if (this.hasWord(query, 'היום')) {
        return { type: 'meeting-today', params: {} };
      }
      if (this.hasWord(query, 'השבוע')) {
        return { type: 'meeting-week', params: {} };
      }
      if (query.includes('קרוב') || query.includes('הבא')) {
        const days = this.extractNumber(query) || 7;
        return { type: 'meeting-upcoming', params: { days } };
      }
      if (this.hasWord(query, 'כמה')) {
        return { type: 'meeting-stats', params: {} };
      }
      return { type: 'meeting-stats', params: {} };
    }

    // === הכנסות ===
    if (this.hasWord(query, 'הכנסות') || query.includes('רווח') || query.includes('כסף') || query.includes('הרווחתי')) {
      return { type: 'revenue-stats', params: { period: this.extractPeriod(query) } };
    }

    // === הצעות מחיר ===
    if (this.hasWord(query, 'הצעה') || query.includes('quote')) {
      if (query.includes('ממתינ') || query.includes('pending')) {
        return { type: 'quote-pending', params: {} };
      }
      return { type: 'quote-stats', params: {} };
    }

    // === חשבוניות ===
    if (this.hasWord(query, 'חשבונית') || query.includes('invoice')) {
      if (query.includes('לא שולמ') || query.includes('unpaid')) {
        return { type: 'invoice-unpaid', params: {} };
      }
      return { type: 'invoice-stats', params: {} };
    }

    // === עובדים ===
    if (this.hasWord(query, 'עובד') || query.includes('צוות')) {
      return { type: 'employee-stats', params: {} };
    }

    // === שאלות כמה כלליות ===
    if (this.hasWord(query, 'כמה') && !query.includes('לקוח') && !query.includes('פרויקט') && !query.includes('משימ')) {
      return { type: 'summary', params: {} };
    }

    return { type: 'unknown', params: { query } };
  }

  // ========== פונקציות עזר ==========

  private extractSearchTerm(query: string, removeWords: string[]): string {
    let result = query;
    for (const word of removeWords) {
      result = result.replace(new RegExp(word, 'gi'), '');
    }
    return result.trim();
  }

  private extractNumber(query: string): number | null {
    const match = query.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private extractPeriod(query: string): 'today' | 'week' | 'month' | 'year' {
    if (query.includes('היום') || query.includes('today')) return 'today';
    if (query.includes('השבוע') || query.includes('week')) return 'week';
    if (query.includes('החודש') || query.includes('month')) return 'month';
    if (query.includes('השנה') || query.includes('year')) return 'year';
    return 'month';
  }

  // ========== תשובות - לקוחות ==========

  private getClientStats(): string {
    const clients = this.context.clients || [];
    const total = clients.length;
    
    if (total === 0) {
      return '📊 אין לקוחות במערכת עדיין.\n\nלחץ על "לקוחות" בתפריט להוספה.';
    }

    const active = clients.filter(c => c.status === 'active').length;
    const pending = clients.filter(c => c.status === 'pending').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;
    
    // לקוחות חדשים החודש
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = clients.filter(c => new Date(c.created_at) >= thisMonth).length;

    return `📊 **סטטיסטיקות לקוחות:**

• סה"כ: **${total}** לקוחות
• פעילים: **${active}** 🟢
• ממתינים: **${pending}** 🟡  
• לא פעילים: **${inactive}** 🔴
• חדשים החודש: **${newThisMonth}** ✨`;
  }

  private searchClients(searchTerm: string): string {
    const clients = this.context.clients || [];
    const term = searchTerm.toLowerCase();
    
    const found = clients.filter(c =>
      c.name?.toLowerCase().includes(term) ||
      c.company?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term)
    );

    if (found.length === 0) {
      return `🔍 לא מצאתי לקוחות עם "${searchTerm}".\n\nנסה חיפוש אחר או בדוק את האיות.`;
    }

    if (found.length === 1) {
      const c = found[0];
      return `🎯 **מצאתי!**

**${c.name}**
${c.company ? `🏢 ${c.company}` : ''}
${c.email ? `📧 ${c.email}` : ''}
${c.phone ? `📱 ${c.phone}` : ''}
📊 סטטוס: ${c.status === 'active' ? '🟢 פעיל' : c.status === 'pending' ? '🟡 ממתין' : '🔴 לא פעיל'}`;
    }

    const list = found.slice(0, 5).map(c => 
      `• **${c.name}** ${c.company ? `(${c.company})` : ''}`
    ).join('\n');

    return `🔍 מצאתי **${found.length}** לקוחות:

${list}${found.length > 5 ? `\n\n...ועוד ${found.length - 5}` : ''}`;
  }

  private getClientList(params: { status?: string }): string {
    const clients = this.context.clients || [];
    let filtered = clients;
    let title = 'כל הלקוחות';

    if (params.status === 'active') {
      filtered = clients.filter(c => c.status === 'active');
      title = 'לקוחות פעילים';
    } else if (params.status === 'inactive') {
      filtered = clients.filter(c => c.status === 'inactive');
      title = 'לקוחות לא פעילים';
    }

    if (filtered.length === 0) {
      return `📋 אין ${title.toLowerCase()}.`;
    }

    const list = filtered.slice(0, 10).map(c => 
      `• ${c.name} ${c.company ? `(${c.company})` : ''}`
    ).join('\n');

    return `📋 **${title}** (${filtered.length}):

${list}${filtered.length > 10 ? `\n\n...ועוד ${filtered.length - 10}` : ''}`;
  }

  // ========== תשובות - פרויקטים ==========

  private getProjectStats(): string {
    const projects = this.context.projects || [];
    const total = projects.length;

    if (total === 0) {
      return '🏗️ אין פרויקטים במערכת עדיין.';
    }

    const active = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
    const completed = projects.filter(p => p.status === 'completed' || p.status === 'done').length;
    const pending = projects.filter(p => p.status === 'pending' || p.status === 'planning').length;

    return `🏗️ **סטטיסטיקות פרויקטים:**

• סה"כ: **${total}** פרויקטים
• בביצוע: **${active}** 🚀
• הושלמו: **${completed}** ✅
• בתכנון: **${pending}** 📋`;
  }

  private searchProjects(searchTerm: string): string {
    const projects = this.context.projects || [];
    const term = searchTerm.toLowerCase();
    
    const found = projects.filter(p =>
      p.name?.toLowerCase().includes(term) ||
      p.description?.toLowerCase().includes(term)
    );

    if (found.length === 0) {
      return `🔍 לא מצאתי פרויקטים עם "${searchTerm}".`;
    }

    const list = found.slice(0, 5).map(p => `• **${p.name}**`).join('\n');
    return `🔍 מצאתי **${found.length}** פרויקטים:\n\n${list}`;
  }

  private getProjectList(params: { status?: string }): string {
    const projects = this.context.projects || [];
    let filtered = projects;

    if (params.status === 'active') {
      filtered = projects.filter(p => p.status === 'active' || p.status === 'in_progress');
    } else if (params.status === 'completed') {
      filtered = projects.filter(p => p.status === 'completed' || p.status === 'done');
    }

    if (filtered.length === 0) {
      return '📋 אין פרויקטים מתאימים.';
    }

    const list = filtered.slice(0, 10).map(p => `• ${p.name}`).join('\n');
    return `📋 **פרויקטים** (${filtered.length}):\n\n${list}`;
  }

  // ========== תשובות - משימות ==========

  private getTaskStats(): string {
    const tasks = this.context.tasks || [];
    const total = tasks.length;

    if (total === 0) {
      return '📋 אין משימות במערכת עדיין.';
    }

    const pending = tasks.filter(t => ['pending', 'todo', 'open'].includes(t.status)).length;
    const inProgress = tasks.filter(t => ['in_progress', 'doing', 'working'].includes(t.status)).length;
    const completed = tasks.filter(t => ['completed', 'done', 'closed'].includes(t.status)).length;
    
    const now = new Date();
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < now && 
      !['completed', 'done', 'closed'].includes(t.status)
    ).length;

    return `📋 **סטטיסטיקות משימות:**

• סה"כ: **${total}** משימות
• ממתינות: **${pending}** 📝
• בביצוע: **${inProgress}** 🔄
• הושלמו: **${completed}** ✅
${overdue > 0 ? `• **באיחור: ${overdue}** ⚠️` : '• אין משימות באיחור 🎉'}`;
  }

  private getOverdueTasks(): string {
    const tasks = this.context.tasks || [];
    const now = new Date();
    
    const overdue = tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < now && 
      !['completed', 'done', 'closed'].includes(t.status)
    );

    if (overdue.length === 0) {
      return '✅ **מעולה!** אין משימות באיחור! 🎉';
    }

    const list = overdue.slice(0, 5).map(t => {
      const dueDate = new Date(t.due_date);
      const daysLate = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return `• **${t.title}** - ${daysLate} ימים באיחור`;
    }).join('\n');

    return `⚠️ **${overdue.length} משימות באיחור:**

${list}${overdue.length > 5 ? `\n\n...ועוד ${overdue.length - 5}` : ''}`;
  }

  private getTodayTasks(): string {
    const tasks = this.context.tasks || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= today && dueDate < tomorrow;
    });

    if (todayTasks.length === 0) {
      return '📅 אין משימות להיום.';
    }

    const list = todayTasks.map(t => 
      `• ${t.title} ${['completed', 'done'].includes(t.status) ? '✅' : '⏳'}`
    ).join('\n');

    return `📅 **משימות להיום** (${todayTasks.length}):\n\n${list}`;
  }

  private getTaskList(params: any): string {
    const tasks = this.context.tasks || [];
    const pending = tasks.filter(t => !['completed', 'done', 'closed'].includes(t.status));
    
    if (pending.length === 0) {
      return '✅ אין משימות פתוחות!';
    }

    const list = pending.slice(0, 10).map(t => `• ${t.title}`).join('\n');
    return `📋 **משימות פתוחות** (${pending.length}):\n\n${list}`;
  }

  // ========== תשובות - זמנים ==========

  private getTimeToday(): string {
    const entries = this.context.timeEntries || [];
    const today = new Date().toISOString().split('T')[0];
    
    const todayEntries = entries.filter(e => e.date === today);
    const totalMinutes = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (totalMinutes === 0) {
      return '⏱️ עדיין לא נרשמו שעות היום.';
    }

    return `⏱️ **שעות עבודה היום:**

**${hours}:${minutes.toString().padStart(2, '0')}** שעות
(${todayEntries.length} רשומות)`;
  }

  private getTimeWeek(): string {
    const entries = this.context.timeEntries || [];
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekEntries = entries.filter(e => new Date(e.date) >= weekAgo);
    const totalMinutes = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `⏱️ **שעות עבודה השבוע:**

**${hours}:${minutes.toString().padStart(2, '0')}** שעות
(${weekEntries.length} רשומות)`;
  }

  private getTimeMonth(): string {
    const entries = this.context.timeEntries || [];
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthEntries = entries.filter(e => new Date(e.date) >= monthStart);
    const totalMinutes = monthEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `⏱️ **שעות עבודה החודש:**

**${hours}:${minutes.toString().padStart(2, '0')}** שעות
(${monthEntries.length} רשומות)`;
  }

  private getTimeStats(params: any): string {
    return this.getTimeMonth();
  }

  // ========== תשובות - פגישות ==========

  private getMeetingsToday(): string {
    const meetings = this.context.meetings || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= today && meetingDate < tomorrow;
    });

    if (todayMeetings.length === 0) {
      return '📅 אין פגישות היום.';
    }

    const list = todayMeetings.map(m => {
      const time = new Date(m.scheduled_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      return `• **${time}** - ${m.title}`;
    }).join('\n');

    return `📅 **פגישות היום** (${todayMeetings.length}):\n\n${list}`;
  }

  private getMeetingsWeek(): string {
    const meetings = this.context.meetings || [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const weekMeetings = meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= today && meetingDate <= weekEnd;
    });

    if (weekMeetings.length === 0) {
      return '📅 אין פגישות השבוע.';
    }

    const list = weekMeetings.slice(0, 7).map(m => {
      const date = new Date(m.scheduled_at);
      const dayName = date.toLocaleDateString('he-IL', { weekday: 'short' });
      const time = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
      return `• **${dayName} ${time}** - ${m.title}`;
    }).join('\n');

    return `📅 **פגישות השבוע** (${weekMeetings.length}):\n\n${list}`;
  }

  private getUpcomingMeetings(days: number): string {
    const meetings = this.context.meetings || [];
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const upcoming = meetings.filter(m => {
      const meetingDate = new Date(m.scheduled_at);
      return meetingDate >= today && meetingDate <= future;
    });

    if (upcoming.length === 0) {
      return `📅 אין פגישות ב-${days} הימים הקרובים.`;
    }

    return `📅 יש **${upcoming.length}** פגישות ב-${days} הימים הקרובים.`;
  }

  private getMeetingStats(): string {
    const meetings = this.context.meetings || [];
    return `📅 יש **${meetings.length}** פגישות במערכת.`;
  }

  // ========== תשובות - הכנסות ==========

  private getRevenueStats(params: any): string {
    const invoices = this.context.invoices || [];
    const quotes = this.context.quotes || [];
    
    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalPaid = paidInvoices.reduce((sum, i) => sum + (i.total || i.amount || 0), 0);
    
    const pendingInvoices = invoices.filter(i => i.status === 'pending');
    const totalPending = pendingInvoices.reduce((sum, i) => sum + (i.total || i.amount || 0), 0);

    return `💰 **סיכום הכנסות:**

• שולם: **₪${totalPaid.toLocaleString()}** ✅
• ממתין לתשלום: **₪${totalPending.toLocaleString()}** ⏳
• סה"כ חשבוניות: **${invoices.length}**
• הצעות מחיר: **${quotes.length}**`;
  }

  // ========== תשובות - הצעות מחיר ==========

  private getQuoteStats(): string {
    const quotes = this.context.quotes || [];
    const pending = quotes.filter(q => q.status === 'pending' || q.status === 'draft').length;
    const accepted = quotes.filter(q => q.status === 'accepted' || q.status === 'approved').length;
    const rejected = quotes.filter(q => q.status === 'rejected' || q.status === 'declined').length;

    return `📝 **הצעות מחיר:**

• סה"כ: **${quotes.length}**
• ממתינות: **${pending}** ⏳
• אושרו: **${accepted}** ✅
• נדחו: **${rejected}** ❌`;
  }

  private getPendingQuotes(): string {
    const quotes = this.context.quotes || [];
    const pending = quotes.filter(q => q.status === 'pending' || q.status === 'draft');

    if (pending.length === 0) {
      return '📝 אין הצעות מחיר ממתינות.';
    }

    const list = pending.slice(0, 5).map(q => `• ${q.title || q.name || 'הצעה'}`).join('\n');
    return `📝 **הצעות ממתינות** (${pending.length}):\n\n${list}`;
  }

  // ========== תשובות - חשבוניות ==========

  private getInvoiceStats(): string {
    const invoices = this.context.invoices || [];
    const paid = invoices.filter(i => i.status === 'paid').length;
    const pending = invoices.filter(i => i.status === 'pending').length;
    const overdue = invoices.filter(i => 
      i.status === 'pending' && i.due_date && new Date(i.due_date) < new Date()
    ).length;

    return `🧾 **חשבוניות:**

• סה"כ: **${invoices.length}**
• שולמו: **${paid}** ✅
• ממתינות: **${pending}** ⏳
${overdue > 0 ? `• **באיחור: ${overdue}** ⚠️` : ''}`;
  }

  private getUnpaidInvoices(): string {
    const invoices = this.context.invoices || [];
    const unpaid = invoices.filter(i => i.status === 'pending');

    if (unpaid.length === 0) {
      return '✅ כל החשבוניות שולמו!';
    }

    const total = unpaid.reduce((sum, i) => sum + (i.total || i.amount || 0), 0);
    return `🧾 **${unpaid.length} חשבוניות לא שולמו**\n\nסה"כ: **₪${total.toLocaleString()}**`;
  }

  // ========== תשובות - עובדים ==========

  private getEmployeeStats(): string {
    const employees = this.context.employees || [];
    return `👥 יש **${employees.length}** עובדים במערכת.`;
  }

  // ========== תשובות - סיכום ==========

  private getDashboardSummary(): string {
    const clients = this.context.clients?.length || 0;
    const projects = this.context.projects?.length || 0;
    const tasks = this.context.tasks?.length || 0;
    const pendingTasks = this.context.tasks?.filter(t => !['completed', 'done'].includes(t.status)).length || 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const meetingsToday = this.context.meetings?.filter(m => {
      const d = new Date(m.scheduled_at);
      return d >= today && d < tomorrow;
    }).length || 0;

    return `📊 **סיכום המערכת:**

👥 לקוחות: **${clients}**
🏗️ פרויקטים: **${projects}**
📋 משימות פתוחות: **${pendingTasks}**
📅 פגישות היום: **${meetingsToday}**

💡 שאל אותי על כל אחד מאלה לפרטים נוספים!`;
  }

  // ========== תשובות - שיחה ==========

  private getGreeting(): string {
    const hour = new Date().getHours();
    let greeting = 'שלום';
    if (hour < 12) greeting = 'בוקר טוב';
    else if (hour < 17) greeting = 'צהריים טובים';
    else if (hour < 21) greeting = 'ערב טוב';
    else greeting = 'לילה טוב';

    return `${greeting}! 👋

אני העוזר החכם של המערכת.
אני יכול לעזור לך למצוא מידע על לקוחות, פרויקטים, משימות ועוד.

**נסה לשאול:**
• "כמה לקוחות יש?"
• "משימות באיחור"
• "פגישות השבוע"
• "סיכום"`;
  }

  private getThanks(): string {
    const responses = [
      'בשמחה! 😊',
      'תמיד לשירותך! 🙌',
      'אין בעד מה! 👍',
      'שמח לעזור! ✨',
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getHelp(): string {
    return `🤖 **איך אני יכול לעזור:**

**לקוחות:**
• "כמה לקוחות יש?" - סטטיסטיקות
• "חפש לקוח X" - חיפוש
• "לקוחות פעילים" - רשימה

**משימות:**
• "משימות באיחור" - דחופות
• "משימות להיום" - יומיות
• "כמה משימות יש?" - סטטיסטיקות

**פגישות:**
• "פגישות היום/השבוע"

**זמנים:**
• "שעות היום/השבוע/החודש"

**כספים:**
• "הכנסות" - סיכום
• "חשבוניות לא שולמו"
• "הצעות מחיר ממתינות"

**כללי:**
• "סיכום" - מצב המערכת`;
  }

  private handleUnknown(query: string): string {
    return `🤔 לא הבנתי בדיוק...

**נסה לשאול אחרת:**
• "כמה לקוחות יש?"
• "משימות באיחור"
• "סיכום"

או הקלד "עזרה" לרשימת האפשרויות.`;
  }
}

export const aiChatService = new AIChatServiceV2();
