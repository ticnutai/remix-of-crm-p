/**
 * AI Chat Actions Service V2 - שירות פעולות מתקדם לצ'אט AI
 * מאפשר לבצע פעולות ישירות מהצ'אט: יצירת פגישות, משימות, לקוחות, פרויקטים, תזכורות, רישום שעות ועוד
 * כולל תמיכה בחיפוש, עדכון ומחיקה
 */

import { supabase } from '@/integrations/supabase/client';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  actionType: string;
  suggestions?: string[];
}

export interface PendingAction {
  type: string;
  params: Record<string, any>;
  confirmMessage: string;
}

type ActionHandler = (params: Record<string, any>) => Promise<ActionResult>;

class AIChatActionsService {
  private pendingAction: PendingAction | null = null;

  /**
   * Execute an action by name - main router for AI-driven actions
   */
  async executeAction(actionName: string, params: Record<string, any>): Promise<ActionResult> {
    const handlers: Record<string, ActionHandler> = {
      'create_task': (p) => this.createTask({
        title: p.title,
        description: p.description,
        priority: p.priority,
        clientName: p.client_name,
        projectName: p.project_name,
        dueDate: p.due_date ? new Date(p.due_date) : undefined,
      }),
      'create_meeting': (p) => this.createMeeting({
        title: p.title,
        clientName: p.client_name,
        date: p.date,
        time: p.time,
        duration_minutes: p.duration_minutes,
        location: p.location,
        notes: p.notes,
      }),
      'create_client': (p) => this.createClient({
        name: p.name,
        email: p.email,
        phone: p.phone,
        company: p.company,
        address: p.address,
        notes: p.notes,
      }),
      'create_project': (p) => this.createProject({
        name: p.name,
        description: p.description,
        clientName: p.client_name,
        budget: p.budget,
        startDate: p.start_date ? new Date(p.start_date) : undefined,
        endDate: p.end_date ? new Date(p.end_date) : undefined,
      }),
      'create_reminder': (p) => this.createReminder({
        title: p.title,
        description: p.description,
        clientName: p.client_name,
        reminderDate: new Date((p.date || new Date().toISOString().split('T')[0]) + 'T' + (p.time || '09:00') + ':00'),
      }),
      'log_hours': (p) => this.createTimeEntry({
        description: p.description,
        hours: p.hours,
        date: p.date ? new Date(p.date) : undefined,
        clientName: p.client_name,
        projectName: p.project_name,
        hourlyRate: p.hourly_rate,
      }),
      'send_email': (p) => this.sendEmail({
        to: p.to,
        subject: p.subject,
        message: p.message,
      }),
      'update_task': (p) => this.updateTaskStatus({
        taskTitle: p.task_title,
        status: p.status,
      }),
      'delete_task': (p) => this.deleteTask({
        taskTitle: p.task_title,
      }),
      'update_meeting': (p) => this.updateMeeting({
        meetingTitle: p.meeting_title,
        status: p.status,
        newDate: p.new_date ? new Date(p.new_date + 'T' + (p.new_time || '10:00') + ':00') : undefined,
      }),
    };

    const handler = handlers[actionName];
    if (!handler) {
      return {
        success: false,
        message: `❌ פעולה לא מוכרת: ${actionName}`,
        actionType: actionName,
      };
    }

    try {
      return await handler(params);
    } catch (error: any) {
      console.error(`Error executing action ${actionName}:`, error);
      return {
        success: false,
        message: `❌ שגיאה בביצוע הפעולה: ${error.message}`,
        actionType: actionName,
      };
    }
  }

  /**
   * שליחת מייל ללקוח
   */
  async sendEmail(params: {
    to: string;
    subject?: string;
    message?: string;
  }): Promise<ActionResult> {
    try {
      let email = params.to;
      let clientName = params.to;

      if (!params.to.includes('@')) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name, email')
          .ilike('name', `%${params.to}%`)
          .limit(1);

        if (clients && clients.length > 0 && clients[0].email) {
          email = clients[0].email;
          clientName = clients[0].name;
        } else {
          return {
            success: false,
            message: `⚠️ לא מצאתי את הלקוח "${params.to}" או שאין לו כתובת מייל במערכת.\n\nאנא ציין כתובת מייל מלאה או בדוק את שם הלקוח.`,
            actionType: 'send_email',
          };
        }
      }

      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
      const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
      const SEND_EMAIL_URL = `${supabaseUrl}/functions/v1/send-reminder-email`;

      const response = await fetch(SEND_EMAIL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          to: email,
          title: params.subject || 'הודעה ממערכת CRM',
          message: params.message || params.subject || 'שלום, זוהי הודעה ממערכת ה-CRM.',
          userName: clientName,
        }),
      });

      if (response.ok) {
        return {
          success: true,
          message: `✅ **המייל נשלח בהצלחה!**\n\n📧 **נמען:** ${clientName} (${email})\n📝 **נושא:** ${params.subject || 'הודעה ממערכת CRM'}`,
          actionType: 'send_email',
        };
      } else {
        return {
          success: false,
          message: `❌ שגיאה בשליחת המייל. נסה שוב מאוחר יותר.`,
          actionType: 'send_email',
        };
      }
    } catch (error: any) {
      console.error('Error sending email:', error);
      return {
        success: false,
        message: `❌ שגיאה בשליחת המייל: ${error.message}`,
        actionType: 'send_email',
      };
    }
  }

  /**
   * יצירת פגישה חדשה
   */
  async createMeeting(params: {
    title: string;
    clientId?: string;
    clientName?: string;
    scheduledAt?: Date;
    date?: string;
    time?: string;
    duration?: number;
    duration_minutes?: number;
    location?: string;
    notes?: string;
  }): Promise<ActionResult> {
    try {
      let clientId = params.clientId;
      if (params.clientName && !clientId) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, name')
          .ilike('name', `%${params.clientName}%`)
          .limit(1);
        if (clients && clients.length > 0) {
          clientId = clients[0].id;
        }
      }

      let scheduledAt = params.scheduledAt;
      if (!scheduledAt && params.date) {
        const timeStr = params.time || '10:00';
        scheduledAt = new Date(`${params.date}T${timeStr}:00`);
      }
      if (!scheduledAt) {
        scheduledAt = new Date();
        scheduledAt.setDate(scheduledAt.getDate() + 1);
        scheduledAt.setHours(10, 0, 0, 0);
      }

      const duration = params.duration_minutes || params.duration || 60;
      const endTime = new Date(scheduledAt.getTime() + duration * 60000);

      const { data, error } = await (supabase as any)
        .from('meetings')
        .insert({
          title: params.title,
          client_id: clientId || null,
          start_time: scheduledAt.toISOString(),
          end_time: endTime.toISOString(),
          location: params.location || null,
          notes: params.notes || null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      const clientInfo = clientId ? '\n👤 עם לקוח: ' + (params.clientName || 'מזוהה') : '';
      return {
        success: true,
        message: '✅ הפגישה "' + params.title + '" נוצרה בהצלחה!\n\n📅 מתוכננת ל: ' + this.formatDate(scheduledAt) + '\n⏱️ משך: ' + duration + ' דקות' + clientInfo,
        data,
        actionType: 'create_meeting',
      };
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת הפגישה: ' + error.message,
        actionType: 'create_meeting',
      };
    }
  }

  /**
   * יצירת משימה חדשה
   */
  async createTask(params: {
    title: string;
    description?: string;
    clientId?: string;
    clientName?: string;
    projectId?: string;
    projectName?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    dueDate?: Date;
    assigneeId?: string;
  }): Promise<ActionResult> {
    try {
      let clientId = params.clientId;
      if (params.clientName && !clientId) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', `%${params.clientName}%`)
          .limit(1);
        if (clients && clients.length > 0) {
          clientId = clients[0].id;
        }
      }

      let projectId = params.projectId;
      if (params.projectName && !projectId) {
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', `%${params.projectName}%`)
          .limit(1);
        if (projects && projects.length > 0) {
          projectId = projects[0].id;
        }
      }

      const dueDate = params.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const { data, error } = await (supabase as any)
        .from('tasks')
        .insert({
          title: params.title,
          description: params.description || null,
          client_id: clientId || null,
          project_id: projectId || null,
          priority: params.priority || 'medium',
          due_date: dueDate.toISOString(),
          assignee_id: params.assigneeId || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: '✅ המשימה "' + params.title + '" נוצרה בהצלחה!\n\n📋 עדיפות: ' + this.getPriorityLabel(params.priority) + '\n📅 דדליין: ' + this.formatDate(dueDate),
        data,
        actionType: 'create_task',
      };
    } catch (error: any) {
      console.error('Error creating task:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת המשימה: ' + error.message,
        actionType: 'create_task',
      };
    }
  }

  /**
   * יצירת לקוח חדש
   */
  async createClient(params: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    notes?: string;
  }): Promise<ActionResult> {
    try {
      const { data: existing } = await supabase
        .from('clients')
        .select('id, name')
        .ilike('name', `%${params.name}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        return {
          success: false,
          message: `⚠️ לקוח בשם דומה כבר קיים: "${existing[0].name}".\n\nאם תרצה ליצור בכל זאת, אמור "צור לקוח חדש בשם ${params.name} בכל זאת".`,
          data: { existing: existing[0] },
          actionType: 'create_client',
        };
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: params.name,
          email: params.email || null,
          phone: params.phone || null,
          company: params.company || null,
          address: params.address || null,
          notes: params.notes || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      const emailInfo = params.email ? '\n📧 מייל: ' + params.email : '';
      const phoneInfo = params.phone ? '\n📱 טלפון: ' + params.phone : '';
      const companyInfo = params.company ? '\n🏢 חברה: ' + params.company : '';
      return {
        success: true,
        message: '✅ הלקוח "' + params.name + '" נוצר בהצלחה!\n\n👤 סטטוס: פעיל' + emailInfo + phoneInfo + companyInfo,
        data,
        actionType: 'create_client',
      };
    } catch (error: any) {
      console.error('Error creating client:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת הלקוח: ' + error.message,
        actionType: 'create_client',
      };
    }
  }

  /**
   * יצירת פרויקט חדש
   */
  async createProject(params: {
    name: string;
    description?: string;
    clientId?: string;
    clientName?: string;
    budget?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ActionResult> {
    try {
      let clientId = params.clientId;
      if (params.clientName && !clientId) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', `%${params.clientName}%`)
          .limit(1);
        if (clients && clients.length > 0) {
          clientId = clients[0].id;
        }
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: params.name,
          description: params.description || null,
          client_id: clientId || null,
          budget: params.budget || null,
          start_date: params.startDate?.toISOString() || null,
          end_date: params.endDate?.toISOString() || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      const budgetInfo = params.budget ? '\n💰 תקציב: ₪' + params.budget.toLocaleString() : '';
      const clientInfo = params.clientName ? '\n👤 לקוח: ' + params.clientName : '';
      return {
        success: true,
        message: '✅ הפרויקט "' + params.name + '" נוצר בהצלחה!\n\n📁 סטטוס: פעיל' + budgetInfo + clientInfo,
        data,
        actionType: 'create_project',
      };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת הפרויקט: ' + error.message,
        actionType: 'create_project',
      };
    }
  }

  /**
   * יצירת תזכורת
   */
  async createReminder(params: {
    title: string;
    description?: string;
    reminderDate: Date;
    clientId?: string;
    clientName?: string;
    projectId?: string;
  }): Promise<ActionResult> {
    try {
      let clientId = params.clientId;
      if (params.clientName && !clientId) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id')
          .ilike('name', `%${params.clientName}%`)
          .limit(1);
        if (clients && clients.length > 0) {
          clientId = clients[0].id;
        }
      }

      const { data, error } = await (supabase as any)
        .from('reminders')
        .insert({
          title: params.title,
          description: params.description || null,
          reminder_date: params.reminderDate.toISOString(),
          client_id: clientId || null,
          project_id: params.projectId || null,
          is_sent: false,
          is_dismissed: false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `✅ התזכורת נוצרה בהצלחה!\n\n🔔 "${params.title}"\n📅 ב: ${this.formatDate(params.reminderDate)}`,
        data,
        actionType: 'create_reminder',
      };
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      return {
        success: false,
        message: `❌ שגיאה ביצירת התזכורת: ${error.message}`,
        actionType: 'create_reminder',
      };
    }
  }

  /**
   * רישום שעות עבודה
   */
  async createTimeEntry(params: {
    description: string;
    hours: number;
    date?: Date;
    clientId?: string;
    clientName?: string;
    projectId?: string;
    projectName?: string;
    hourlyRate?: number;
  }): Promise<ActionResult> {
    try {
      const date = params.date || new Date();
      const { data, error } = await (supabase as any)
        .from('time_entries')
        .insert({
          description: params.description,
          start_time: date.toISOString(),
          duration_minutes: Math.round(params.hours * 60),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `✅ נרשמו ${params.hours} שעות עבודה!\n\n📝 "${params.description}"\n📅 תאריך: ${this.formatDate(date)}`,
        data,
        actionType: 'log_hours',
      };
    } catch (error: any) {
      console.error('Error creating time entry:', error);
      return {
        success: false,
        message: `❌ שגיאה ברישום השעות: ${error.message}`,
        actionType: 'log_hours',
      };
    }
  }

  /**
   * עדכון סטטוס משימה
   */
  async updateTaskStatus(params: {
    taskId?: string;
    taskTitle?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  }): Promise<ActionResult> {
    try {
      let taskId = params.taskId;

      if (params.taskTitle && !taskId) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title')
          .ilike('title', `%${params.taskTitle}%`)
          .limit(1);
        
        if (tasks && tasks.length > 0) {
          taskId = tasks[0].id;
        } else {
          return {
            success: false,
            message: `❌ לא מצאתי משימה עם הכותרת "${params.taskTitle}"`,
            actionType: 'update_task',
          };
        }
      }

      if (!taskId) {
        return { success: false, message: '❌ לא צוין מזהה או שם משימה', actionType: 'update_task' };
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: params.status,
          completed_at: params.status === 'completed' ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `✅ סטטוס המשימה עודכן ל: ${this.getStatusLabel(params.status)}`,
        data,
        actionType: 'update_task',
      };
    } catch (error: any) {
      console.error('Error updating task:', error);
      return { success: false, message: `❌ שגיאה בעדכון המשימה: ${error.message}`, actionType: 'update_task' };
    }
  }

  /**
   * מחיקת משימה
   */
  async deleteTask(params: { taskId?: string; taskTitle?: string }): Promise<ActionResult> {
    try {
      let taskId = params.taskId;
      let taskTitle = params.taskTitle;

      if (params.taskTitle && !taskId) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title')
          .ilike('title', `%${params.taskTitle}%`)
          .limit(1);
        
        if (tasks && tasks.length > 0) {
          taskId = tasks[0].id;
          taskTitle = tasks[0].title;
        } else {
          return { success: false, message: `❌ לא מצאתי משימה עם הכותרת "${params.taskTitle}"`, actionType: 'delete_task' };
        }
      }

      if (!taskId) {
        return { success: false, message: '❌ לא צוין מזהה או שם משימה', actionType: 'delete_task' };
      }

      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      return { success: true, message: `✅ המשימה "${taskTitle}" נמחקה בהצלחה`, actionType: 'delete_task' };
    } catch (error: any) {
      console.error('Error deleting task:', error);
      return { success: false, message: `❌ שגיאה במחיקת המשימה: ${error.message}`, actionType: 'delete_task' };
    }
  }

  /**
   * עדכון פגישה
   */
  async updateMeeting(params: {
    meetingId?: string;
    meetingTitle?: string;
    status?: 'scheduled' | 'completed' | 'cancelled';
    newDate?: Date;
  }): Promise<ActionResult> {
    try {
      let meetingId = params.meetingId;

      if (params.meetingTitle && !meetingId) {
        const { data: meetings } = await supabase
          .from('meetings')
          .select('id, title')
          .ilike('title', `%${params.meetingTitle}%`)
          .eq('status', 'scheduled')
          .limit(1);
        
        if (meetings && meetings.length > 0) {
          meetingId = meetings[0].id;
        } else {
          return { success: false, message: `❌ לא מצאתי פגישה עם הכותרת "${params.meetingTitle}"`, actionType: 'update_meeting' };
        }
      }

      if (!meetingId) {
        return { success: false, message: '❌ לא צוין מזהה או שם פגישה', actionType: 'update_meeting' };
      }

      const updates: Record<string, any> = {};
      if (params.status) updates.status = params.status;
      if (params.newDate) {
        updates.start_time = params.newDate.toISOString();
        updates.end_time = new Date(params.newDate.getTime() + 60 * 60000).toISOString();
      }

      const { data, error } = await supabase.from('meetings').update(updates).eq('id', meetingId).select().single();
      if (error) throw error;

      const statusInfo = params.status ? '\n📊 סטטוס: ' + this.getMeetingStatusLabel(params.status) : '';
      const dateInfo = params.newDate ? '\n📅 תאריך חדש: ' + this.formatDate(params.newDate) : '';
      return { success: true, message: '✅ הפגישה עודכנה בהצלחה!' + statusInfo + dateInfo, data, actionType: 'update_meeting' };
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      return { success: false, message: '❌ שגיאה בעדכון הפגישה: ' + error.message, actionType: 'update_meeting' };
    }
  }

  // ========== Helper Functions ==========

  private formatDate(date: Date): string {
    try {
      return date.toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return date.toISOString();
    }
  }

  private getPriorityLabel(priority?: string): string {
    switch (priority) {
      case 'urgent': return '🔴 דחוף';
      case 'high': return '🟠 גבוהה';
      case 'medium': return '🟡 בינונית';
      case 'low': return '🟢 נמוכה';
      default: return '🟡 בינונית';
    }
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return '⏳ ממתינה';
      case 'in_progress': return '🔄 בתהליך';
      case 'completed': return '✅ הושלמה';
      case 'cancelled': return '❌ בוטלה';
      default: return status;
    }
  }

  private getMeetingStatusLabel(status: string): string {
    switch (status) {
      case 'scheduled': return '📅 מתוכננת';
      case 'completed': return '✅ הסתיימה';
      case 'cancelled': return '❌ בוטלה';
      default: return status;
    }
  }

  // ========== Pending Action Methods ==========

  setPendingAction(action: PendingAction) {
    this.pendingAction = action;
  }

  getPendingAction(): PendingAction | null {
    return this.pendingAction;
  }

  clearPendingAction() {
    this.pendingAction = null;
  }

  async executePendingAction(): Promise<ActionResult | null> {
    if (!this.pendingAction) return null;
    const action = this.pendingAction;
    this.clearPendingAction();
    return this.executeAction(action.type, action.params);
  }
}

export const aiChatActionsService = new AIChatActionsService();
