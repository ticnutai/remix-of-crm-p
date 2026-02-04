/**
 * AI Chat Actions Service - שירות פעולות לצ'אט AI
 * מאפשר לבצע פעולות ישירות מהצ'אט: יצירת פגישות, משימות, לקוחות ועוד
 */

import { supabase } from '@/integrations/supabase/client';

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  actionType: string;
}

export interface PendingAction {
  type: string;
  params: Record<string, any>;
  confirmMessage: string;
}

class AIChatActionsService {
  private pendingAction: PendingAction | null = null;

  /**
   * יצירת פגישה חדשה
   */
  async createMeeting(params: {
    title: string;
    clientId?: string;
    clientName?: string;
    scheduledAt: Date;
    duration?: number;
    location?: string;
    notes?: string;
  }): Promise<ActionResult> {
    try {
      // אם ניתן שם לקוח, נמצא את ה-ID שלו
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

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          title: params.title,
          client_id: clientId || null,
          scheduled_at: params.scheduledAt.toISOString(),
          duration_minutes: params.duration || 60,
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
        message: '✅ הפגישה "' + params.title + '" נוצרה בהצלחה!\n\n📅 מתוכננת ל: ' + this.formatDate(params.scheduledAt) + clientInfo,
        data,
        actionType: 'create-meeting',
      };
    } catch (error: any) {
      console.error('Error creating meeting:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת הפגישה: ' + error.message,
        actionType: 'create-meeting',
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
      // מציאת לקוח לפי שם
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

      // מציאת פרויקט לפי שם
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

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: params.title,
          description: params.description || null,
          client_id: clientId || null,
          project_id: projectId || null,
          priority: params.priority || 'medium',
          due_date: params.dueDate?.toISOString() || null,
          assignee_id: params.assigneeId || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      const dueDateInfo = params.dueDate ? '\n📅 דדליין: ' + this.formatDate(params.dueDate) : '';
      return {
        success: true,
        message: '✅ המשימה "' + params.title + '" נוצרה בהצלחה!\n\n📋 עדיפות: ' + this.getPriorityLabel(params.priority) + dueDateInfo,
        data,
        actionType: 'create-task',
      };
    } catch (error: any) {
      console.error('Error creating task:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת המשימה: ' + error.message,
        actionType: 'create-task',
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
      // בדיקה אם הלקוח כבר קיים
      const { data: existing } = await supabase
        .from('clients')
        .select('id, name')
        .or(`name.ilike.%${params.name}%,email.eq.${params.email || ''}`)
        .limit(1);

      if (existing && existing.length > 0) {
        return {
          success: false,
          message: `⚠️ לקוח בשם דומה כבר קיים: "${existing[0].name}".\n\nהאם תרצה ליצור בכל זאת?`,
          data: { existing: existing[0] },
          actionType: 'create-client',
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
      return {
        success: true,
        message: '✅ הלקוח "' + params.name + '" נוצר בהצלחה!\n\n👤 סטטוס: פעיל' + emailInfo + phoneInfo,
        data,
        actionType: 'create-client',
      };
    } catch (error: any) {
      console.error('Error creating client:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת הלקוח: ' + error.message,
        actionType: 'create-client',
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
      // מציאת לקוח לפי שם
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
      return {
        success: true,
        message: '✅ הפרויקט "' + params.name + '" נוצר בהצלחה!\n\n📁 סטטוס: פעיל' + budgetInfo,
        data,
        actionType: 'create-project',
      };
    } catch (error: any) {
      console.error('Error creating project:', error);
      return {
        success: false,
        message: '❌ שגיאה ביצירת הפרויקט: ' + error.message,
        actionType: 'create-project',
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
      // מציאת לקוח לפי שם
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
        actionType: 'create-reminder',
      };
    } catch (error: any) {
      console.error('Error creating reminder:', error);
      return {
        success: false,
        message: `❌ שגיאה ביצירת התזכורת: ${error.message}`,
        actionType: 'create-reminder',
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
      // מציאת לקוח לפי שם
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

      // מציאת פרויקט לפי שם
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

      const date = params.date || new Date();
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          description: params.description,
          hours: params.hours,
          date: date.toISOString().split('T')[0],
          client_id: clientId || null,
          project_id: projectId || null,
          hourly_rate: params.hourlyRate || null,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: `✅ נרשמו ${params.hours} שעות עבודה!\n\n📝 "${params.description}"\n📅 תאריך: ${this.formatDate(date)}`,
        data,
        actionType: 'create-time-entry',
      };
    } catch (error: any) {
      console.error('Error creating time entry:', error);
      return {
        success: false,
        message: `❌ שגיאה ברישום השעות: ${error.message}`,
        actionType: 'create-time-entry',
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

      // מציאת משימה לפי כותרת
      if (params.taskTitle && !taskId) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, title')
          .ilike('title', `%${params.taskTitle}%`)
          .eq('status', 'pending')
          .limit(1);
        
        if (tasks && tasks.length > 0) {
          taskId = tasks[0].id;
        } else {
          return {
            success: false,
            message: `❌ לא מצאתי משימה עם הכותרת "${params.taskTitle}"`,
            actionType: 'update-task-status',
          };
        }
      }

      if (!taskId) {
        return {
          success: false,
          message: '❌ לא צוין מזהה משימה',
          actionType: 'update-task-status',
        };
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

      const statusLabel = this.getStatusLabel(params.status);
      return {
        success: true,
        message: `✅ סטטוס המשימה עודכן ל: ${statusLabel}`,
        data,
        actionType: 'update-task-status',
      };
    } catch (error: any) {
      console.error('Error updating task:', error);
      return {
        success: false,
        message: `❌ שגיאה בעדכון המשימה: ${error.message}`,
        actionType: 'update-task-status',
      };
    }
  }

  /**
   * מחיקת משימה
   */
  async deleteTask(params: {
    taskId?: string;
    taskTitle?: string;
  }): Promise<ActionResult> {
    try {
      let taskId = params.taskId;
      let taskTitle = params.taskTitle;

      // מציאת משימה לפי כותרת
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
          return {
            success: false,
            message: `❌ לא מצאתי משימה עם הכותרת "${params.taskTitle}"`,
            actionType: 'delete-task',
          };
        }
      }

      if (!taskId) {
        return {
          success: false,
          message: '❌ לא צוין מזהה משימה',
          actionType: 'delete-task',
        };
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      return {
        success: true,
        message: `✅ המשימה "${taskTitle}" נמחקה בהצלחה`,
        actionType: 'delete-task',
      };
    } catch (error: any) {
      console.error('Error deleting task:', error);
      return {
        success: false,
        message: `❌ שגיאה במחיקת המשימה: ${error.message}`,
        actionType: 'delete-task',
      };
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

      // מציאת פגישה לפי כותרת
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
          return {
            success: false,
            message: `❌ לא מצאתי פגישה עם הכותרת "${params.meetingTitle}"`,
            actionType: 'update-meeting',
          };
        }
      }

      if (!meetingId) {
        return {
          success: false,
          message: '❌ לא צוין מזהה פגישה',
          actionType: 'update-meeting',
        };
      }

      const updates: Record<string, any> = {};
      if (params.status) updates.status = params.status;
      if (params.newDate) updates.scheduled_at = params.newDate.toISOString();

      const { data, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', meetingId)
        .select()
        .single();

      if (error) throw error;

      const statusInfo = params.status ? '\n📊 סטטוס: ' + this.getMeetingStatusLabel(params.status) : '';
      const dateInfo = params.newDate ? '\n📅 תאריך חדש: ' + this.formatDate(params.newDate) : '';
      return {
        success: true,
        message: '✅ הפגישה עודכנה בהצלחה!' + statusInfo + dateInfo,
        data,
        actionType: 'update-meeting',
      };
    } catch (error: any) {
      console.error('Error updating meeting:', error);
      return {
        success: false,
        message: '❌ שגיאה בעדכון הפגישה: ' + error.message,
        actionType: 'update-meeting',
      };
    }
  }

  // ========== פונקציות עזר ==========

  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return date.toLocaleDateString('he-IL', options);
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

  /**
   * שמירת פעולה ממתינה (לאישור המשתמש)
   */
  setPendingAction(action: PendingAction) {
    this.pendingAction = action;
  }

  /**
   * קבלת פעולה ממתינה
   */
  getPendingAction(): PendingAction | null {
    return this.pendingAction;
  }

  /**
   * ניקוי פעולה ממתינה
   */
  clearPendingAction() {
    this.pendingAction = null;
  }

  /**
   * ביצוע פעולה ממתינה
   */
  async executePendingAction(): Promise<ActionResult | null> {
    if (!this.pendingAction) return null;

    const action = this.pendingAction;
    this.clearPendingAction();

    switch (action.type) {
      case 'create-meeting':
        return this.createMeeting(action.params as any);
      case 'create-task':
        return this.createTask(action.params as any);
      case 'create-client':
        return this.createClient(action.params as any);
      case 'create-project':
        return this.createProject(action.params as any);
      case 'create-reminder':
        return this.createReminder(action.params as any);
      case 'create-time-entry':
        return this.createTimeEntry(action.params as any);
      case 'update-task-status':
        return this.updateTaskStatus(action.params as any);
      case 'delete-task':
        return this.deleteTask(action.params as any);
      case 'update-meeting':
        return this.updateMeeting(action.params as any);
      default:
        return null;
    }
  }
}

export const aiChatActionsService = new AIChatActionsService();
