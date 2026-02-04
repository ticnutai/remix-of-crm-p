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
      case 'project-stats':
        response = await this.getProjectStats();
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
      case 'task-stats':
        response = await this.getTaskStats();
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
    // סטטיסטיקות לקוחות - חייב לבוא לפני חיפוש לקוח!
    if (
      query.includes('כמה לקוחות') || 
      query.includes('סה"כ לקוחות') ||
      query.includes('מספר לקוחות') ||
      query.includes('לקוחות יש') ||
      query.includes('כמה יש לקוחות') ||
      (query.includes('כמה') && query.includes('לקוח'))
    ) {
      return { type: 'client-stats', params: {} };
    }

    // חיפוש לקוח ספציפי - משופר לזהות גם שמות ישירים
    if (
      (query.includes('לקוח') && (query.includes('מצא') || query.includes('חפש') || query.includes('בשם'))) ||
      (query.includes('לקוח') && !query.includes('כמה') && !query.includes('סה"כ') && !query.includes('רשימ'))
    ) {
      return { type: 'client-search', params: { query } };
    }

    // ניסיון לזהות שם לקוח ישירות - אם מוזכר שם שקיים במערכת
    const possibleName = this.extractClientName(query);
    if (possibleName && possibleName.length >= 2) {
      const matchedClient = this.findClientByName(possibleName);
      if (matchedClient) {
        return { type: 'client-search', params: { query } };
      }
    }

    // חיפוש פרויקט - גם כאן, סטטיסטיקות לפני חיפוש
    if (query.includes('כמה פרויקט') || query.includes('כמה פרוייקט') || query.includes('פרויקטים יש') || query.includes('פרוייקטים יש')) {
      return { type: 'project-stats', params: {} };
    }
    if (query.includes('פרויקט') || query.includes('פרוייקט')) {
      return { type: 'project-search', params: { query } };
    }

    // סיכום זמנים
    if (query.includes('שעות') || (query.includes('זמן') && (query.includes('היום') || query.includes('השבוע') || query.includes('החודש')))) {
      return { type: 'time-summary', params: { period: this.extractPeriod(query) } };
    }

    // דוח הכנסות
    if (query.includes('הכנסות') || query.includes('רווח') || query.includes('כסף')) {
      return { type: 'revenue-report', params: { period: this.extractPeriod(query) } };
    }

    // משימות - סטטיסטיקות
    if (query.includes('כמה משימ') || query.includes('משימות יש')) {
      return { type: 'task-stats', params: {} };
    }

    // משימות באיחור
    if (query.includes('משימ') && query.includes('באיחור')) {
      return { type: 'overdue-tasks', params: {} };
    }

    // משימות
    if (query.includes('משימ')) {
      return { type: 'task-list', params: { status: this.extractTaskStatus(query) } };
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
   * נרמול טקסט לחיפוש - מסיר תווים מיוחדים ומאחד רווחים
   */
  private normalizeText(text: string): string {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/['"״׳`]/g, '') // הסרת גרשיים
      .replace(/[-_\.]/g, ' ') // המרת מקפים לרווחים
      .replace(/\s+/g, ' ')    // איחוד רווחים
      .trim();
  }

  /**
   * חילוץ שם לקוח משאלה - משופר
   */
  private extractClientName(query: string): string {
    const normalizedQuery = this.normalizeText(query);
    
    // הסרת מילות מפתח בעברית
    const keywords = [
      'מצא', 'חפש', 'תמצא', 'תחפש', 'לי',
      'את', 'ה', 'של', 'על', 'אצל', 'עבור',
      'לקוח', 'לקוחה', 'לקוחות',
      'מה', 'מי', 'איפה', 'איך', 'למה',
      'נתונים', 'פרטים', 'מידע', 'פרויקטים', 'פרוייקטים',
      'שעות', 'זמן', 'עבודה', 'משימות', 'חשבוניות'
    ];
    
    let result = normalizedQuery;
    keywords.forEach(word => {
      result = result.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
    });
    
    return result.replace(/\s+/g, ' ').trim();
  }

  /**
   * חיפוש לקוח לפי שם - מחזיר את הלקוח הראשון שמתאים
   */
  private findClientByName(searchTerm: string): any | null {
    if (!searchTerm || searchTerm.length < 2) return null;
    
    const normalizedSearch = this.normalizeText(searchTerm);
    const searchWords = normalizedSearch.split(' ').filter(w => w.length > 1);
    
    for (const client of (this.context.clients || [])) {
      const normalizedName = this.normalizeText(client.name || '');
      const nameWords = normalizedName.split(' ').filter(w => w.length > 1);
      
      // התאמה מלאה
      if (normalizedName === normalizedSearch) return client;
      if (normalizedName.includes(normalizedSearch)) return client;
      if (normalizedSearch.includes(normalizedName) && normalizedName.length > 3) return client;
      
      // חיפוש מילים (שם הפוך)
      if (searchWords.length > 0 && nameWords.length > 0) {
        const matchingWords = searchWords.filter(sw => 
          nameWords.some(nw => nw.includes(sw) || sw.includes(nw))
        );
        
        // אם לפחות חצי מהמילים מתאימות
        if (matchingWords.length >= Math.ceil(searchWords.length / 2)) {
          return client;
        }
      }
    }
    
    return null;
  }

  /**
   * חיפוש Fuzzy - בודק דמיון בין מחרוזות
   */
  private fuzzyMatch(str1: string, str2: string): number {
    const s1 = this.normalizeText(str1);
    const s2 = this.normalizeText(str2);
    
    if (s1 === s2) return 1;
    if (!s1 || !s2) return 0;
    
    // בדיקת הכלה
    if (s1.includes(s2) || s2.includes(s1)) return 0.9;
    
    // בדיקת מילים - שם הפוך (יוסי כהן / כהן יוסי)
    const words1 = s1.split(' ').filter(w => w.length > 1);
    const words2 = s2.split(' ').filter(w => w.length > 1);
    
    // כמה מילים משותפות
    const matchingWords = words1.filter(w1 => 
      words2.some(w2 => w1.includes(w2) || w2.includes(w1))
    );
    
    if (matchingWords.length > 0) {
      return matchingWords.length / Math.max(words1.length, words2.length);
    }
    
    // Levenshtein distance פשוט
    const len1 = s1.length;
    const len2 = s2.length;
    const maxLen = Math.max(len1, len2);
    
    if (maxLen === 0) return 1;
    
    // חישוב מרחק עריכה מקורב
    let distance = 0;
    const minLen = Math.min(len1, len2);
    for (let i = 0; i < minLen; i++) {
      if (s1[i] !== s2[i]) distance++;
    }
    distance += Math.abs(len1 - len2);
    
    return 1 - (distance / maxLen);
  }

  /**
   * חיפוש לקוחות - משופר עם זיהוי חכם
   */
  private async searchClients(params: any): Promise<string> {
    const { query } = params;
    const searchTerm = this.extractClientName(query);

    if (!searchTerm || searchTerm.length < 2) {
      return `יש ${this.context.clients?.length || 0} לקוחות במערכת. מה תרצה לדעת עליהם?`;
    }

    const normalizedSearch = this.normalizeText(searchTerm);
    const searchWords = normalizedSearch.split(' ').filter(w => w.length > 1);

    // חיפוש עם דירוג
    const scoredClients = (this.context.clients || []).map(client => {
      const normalizedName = this.normalizeText(client.name || '');
      const normalizedCompany = this.normalizeText(client.company || '');
      const normalizedEmail = this.normalizeText(client.email || '');
      
      let score = 0;
      
      // התאמה מלאה - הכי גבוה
      if (normalizedName === normalizedSearch) score = 100;
      else if (normalizedName.includes(normalizedSearch)) score = 90;
      else if (normalizedSearch.includes(normalizedName)) score = 85;
      
      // חיפוש בשם החברה
      if (normalizedCompany === normalizedSearch) score = Math.max(score, 95);
      else if (normalizedCompany.includes(normalizedSearch)) score = Math.max(score, 80);
      
      // חיפוש באימייל
      if (normalizedEmail.includes(normalizedSearch)) score = Math.max(score, 75);
      
      // חיפוש מילים בודדות (שם הפוך)
      if (score < 70 && searchWords.length > 0) {
        const nameWords = normalizedName.split(' ').filter(w => w.length > 1);
        let wordMatches = 0;
        
        searchWords.forEach(searchWord => {
          if (nameWords.some(nameWord => 
            nameWord.includes(searchWord) || searchWord.includes(nameWord) ||
            this.fuzzyMatch(nameWord, searchWord) > 0.7
          )) {
            wordMatches++;
          }
        });
        
        if (wordMatches > 0) {
          const wordScore = (wordMatches / searchWords.length) * 70;
          score = Math.max(score, wordScore);
        }
      }
      
      // Fuzzy match כפתרון אחרון
      if (score < 50) {
        const fuzzyScore = this.fuzzyMatch(normalizedName, normalizedSearch) * 60;
        score = Math.max(score, fuzzyScore);
      }
      
      return { client, score };
    }).filter(item => item.score >= 40) // סף מינימלי
      .sort((a, b) => b.score - a.score);

    const found = scoredClients.map(s => s.client);

    if (found.length === 0) {
      // נסיון אחרון - חיפוש חלקי
      const partialFound = (this.context.clients || []).filter(c => {
        const name = this.normalizeText(c.name || '');
        return searchWords.some(word => name.includes(word));
      });
      
      if (partialFound.length > 0) {
        const list = partialFound.slice(0, 5).map(c => `• ${c.name} (${c.company || 'ללא חברה'})`).join('\n');
        return `לא מצאתי התאמה מדויקת ל"${searchTerm}", אבל אולי התכוונת ל:\n\n${list}`;
      }
      
      return `לא מצאתי לקוח עם השם "${searchTerm}" 😕\n\nיש ${this.context.clients?.length || 0} לקוחות במערכת.`;
    }

    if (found.length === 1) {
      const client = found[0];
      const projects = this.context.projects?.filter(p => p.client_id === client.id) || [];
      const tasks = this.context.tasks?.filter(t => t.client_id === client.id) || [];
      
      return `מצאתי! 🎯\n\n**${client.name}**\n- חברה: ${client.company || 'לא צוין'}\n- אימייל: ${client.email || 'לא צוין'}\n- טלפון: ${client.phone || 'לא צוין'}\n- סטטוס: ${client.status || 'לא צוין'}\n- פרויקטים: ${projects.length}\n- משימות: ${tasks.length}\n- נוצר: ${new Date(client.created_at).toLocaleDateString('he-IL')}`;
    }

    const list = found.slice(0, 5).map(c => `• ${c.name} (${c.company || 'ללא חברה'})`).join('\n');
    return `מצאתי ${found.length} לקוחות תואמים:\n\n${list}${found.length > 5 ? '\n\n...ועוד ' + (found.length - 5) : ''}`;
  }

  /**
   * סטטיסטיקות לקוחות
   */
  private async getClientStats(): Promise<string> {
    const clients = this.context.clients || [];
    const total = clients.length;
    
    if (total === 0) {
      return `📊 אין לקוחות במערכת עדיין.\n\nלחץ על "לקוחות" בתפריט כדי להוסיף לקוחות.`;
    }

    const active = clients.filter(c => c.status === 'active').length;
    const pending = clients.filter(c => c.status === 'pending').length;
    const inactive = clients.filter(c => c.status === 'inactive').length;

    const activePercent = total > 0 ? Math.round(active/total*100) : 0;
    const pendingPercent = total > 0 ? Math.round(pending/total*100) : 0;
    const inactivePercent = total > 0 ? Math.round(inactive/total*100) : 0;

    return `📊 סטטיסטיקות לקוחות:\n\n• סה"כ: **${total}** לקוחות\n• פעילים: **${active}** (${activePercent}%)\n• ממתינים: **${pending}** (${pendingPercent}%)\n• לא פעילים: **${inactive}** (${inactivePercent}%)`;
  }

  /**
   * סטטיסטיקות פרויקטים
   */
  private async getProjectStats(): Promise<string> {
    const projects = this.context.projects || [];
    const total = projects.length;
    
    if (total === 0) {
      return `🏗️ אין פרויקטים במערכת עדיין.`;
    }

    const active = projects.filter(p => p.status === 'active').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const onHold = projects.filter(p => p.status === 'on_hold' || p.status === 'paused').length;

    return `🏗️ סטטיסטיקות פרויקטים:\n\n• סה"כ: **${total}** פרויקטים\n• פעילים: **${active}**\n• הושלמו: **${completed}**\n• בהמתנה: **${onHold}**`;
  }

  /**
   * סטטיסטיקות משימות
   */
  private async getTaskStats(): Promise<string> {
    const tasks = this.context.tasks || [];
    const total = tasks.length;
    
    if (total === 0) {
      return `📋 אין משימות במערכת עדיין.`;
    }

    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'todo').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress' || t.status === 'doing').length;
    const completed = tasks.filter(t => t.status === 'completed' || t.status === 'done').length;
    
    const today = new Date();
    const overdue = tasks.filter(t => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < today && t.status !== 'completed' && t.status !== 'done';
    }).length;

    return `📋 סטטיסטיקות משימות:\n\n• סה"כ: **${total}** משימות\n• בהמתנה: **${pending}**\n• בביצוע: **${inProgress}**\n• הושלמו: **${completed}**\n• באיחור: **${overdue}** ⚠️`;
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
