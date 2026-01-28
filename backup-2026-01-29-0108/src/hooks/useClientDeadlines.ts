// Client Deadlines Hook - מערכת ניהול זמנים וספירת ימים
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  calculateDeadlineDate, 
  calculateRemainingWorkdays, 
  countWorkdaysPassed,
  getUrgencyLevel 
} from '@/hooks/useIsraeliWorkdays';

export interface ClientDeadline {
  id: string;
  client_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: 'submission' | 'response' | 'appeal' | 'permit' | 'custom';
  start_date: string;
  deadline_days: number;
  reminder_days: number[];
  status: 'active' | 'completed' | 'cancelled' | 'overdue';
  completed_at: string | null;
  notes: string | null;
  linked_stage_id: string | null;
  created_at: string;
  updated_at: string;
  // Computed fields (not in DB)
  deadline_date?: Date;
  days_passed?: number;
  days_remaining?: number;
  urgency?: 'safe' | 'warning' | 'danger' | 'overdue';
}

export interface DeadlineTemplate {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string;
  deadline_days: number;
  reminder_days: number[];
  is_system: boolean;
  created_at: string;
}

export interface DeadlineInsert {
  client_id: string;
  title: string;
  description?: string | null;
  category?: string;
  start_date: string;
  deadline_days: number;
  reminder_days?: number[];
  notes?: string | null;
  linked_stage_id?: string | null;
}

export function useClientDeadlines(clientId?: string) {
  const [deadlines, setDeadlines] = useState<ClientDeadline[]>([]);
  const [templates, setTemplates] = useState<DeadlineTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Enrich deadline with computed fields
  const enrichDeadline = useCallback((deadline: ClientDeadline): ClientDeadline => {
    const startDate = new Date(deadline.start_date);
    const deadlineDate = calculateDeadlineDate(startDate, deadline.deadline_days);
    const daysPassed = countWorkdaysPassed(startDate);
    const daysRemaining = calculateRemainingWorkdays(startDate, deadline.deadline_days);
    const urgency = getUrgencyLevel(daysRemaining, deadline.deadline_days);

    return {
      ...deadline,
      deadline_date: deadlineDate,
      days_passed: daysPassed,
      days_remaining: daysRemaining,
      urgency,
    };
  }, []);

  // Fetch deadlines
  const fetchDeadlines = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('client_deadlines')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with computed fields and check for overdue
      const enrichedDeadlines = (data || []).map(d => {
        const enriched = enrichDeadline(d as ClientDeadline);
        // Auto-update status to overdue if needed
        if (enriched.status === 'active' && enriched.days_remaining === 0) {
          enriched.status = 'overdue';
          // Update in DB asynchronously
          supabase
            .from('client_deadlines')
            .update({ status: 'overdue' })
            .eq('id', enriched.id)
            .then();
        }
        return enriched;
      });

      setDeadlines(enrichedDeadlines);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את מניין הימים',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, clientId, enrichDeadline, toast]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('deadline_templates')
        .select('*')
        .order('is_system', { ascending: false })
        .order('title');

      if (error) throw error;
      setTemplates((data || []) as DeadlineTemplate[]);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  // Create deadline
  const createDeadline = useCallback(async (deadlineData: DeadlineInsert) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('client_deadlines')
        .insert({
          ...deadlineData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const enriched = enrichDeadline(data as ClientDeadline);
      setDeadlines(prev => [enriched, ...prev]);

      // Create reminders for this deadline
      await createRemindersForDeadline(enriched);

      toast({
        title: 'נוצר בהצלחה',
        description: `מניין "${deadlineData.title}" נוסף`,
      });

      return enriched;
    } catch (error) {
      console.error('Error creating deadline:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן ליצור מניין חדש',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, enrichDeadline, toast]);

  // Create reminders for a deadline
  const createRemindersForDeadline = useCallback(async (deadline: ClientDeadline) => {
    if (!user || !deadline.reminder_days?.length) return;

    const startDate = new Date(deadline.start_date);
    const remindersToCreate = [];

    for (const daysBefore of deadline.reminder_days) {
      const daysUntilReminder = deadline.deadline_days - daysBefore;
      if (daysUntilReminder <= 0) continue;

      // Calculate reminder date (workdays from start)
      const reminderDate = new Date(startDate);
      let workdaysAdded = 0;
      while (workdaysAdded < daysUntilReminder) {
        reminderDate.setDate(reminderDate.getDate() + 1);
        const day = reminderDate.getDay();
        if (day !== 5 && day !== 6) { // Not Friday or Saturday
          workdaysAdded++;
        }
      }
      reminderDate.setHours(9, 0, 0, 0); // Set to 9 AM

      // Only create future reminders
      if (reminderDate > new Date()) {
        remindersToCreate.push({
          title: `⏰ ${deadline.title} - ${daysBefore} ימים לסיום`,
          message: `נותרו ${daysBefore} ימי עבודה לסיום המועד`,
          remind_at: reminderDate.toISOString(),
          reminder_type: 'browser',
          entity_type: 'client_deadline',
          entity_id: deadline.id,
          user_id: user.id,
        });
      }
    }

    if (remindersToCreate.length > 0) {
      await supabase.from('reminders').insert(remindersToCreate);
    }
  }, [user]);

  // Update deadline
  const updateDeadline = useCallback(async (id: string, updates: Partial<ClientDeadline>) => {
    try {
      const { data, error } = await supabase
        .from('client_deadlines')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const enriched = enrichDeadline(data as ClientDeadline);
      setDeadlines(prev => prev.map(d => d.id === id ? enriched : d));

      toast({
        title: 'עודכן בהצלחה',
      });

      return enriched;
    } catch (error) {
      console.error('Error updating deadline:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לעדכן',
        variant: 'destructive',
      });
      return null;
    }
  }, [enrichDeadline, toast]);

  // Complete deadline
  const completeDeadline = useCallback(async (id: string) => {
    return updateDeadline(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  }, [updateDeadline]);

  // Cancel deadline
  const cancelDeadline = useCallback(async (id: string) => {
    return updateDeadline(id, { status: 'cancelled' });
  }, [updateDeadline]);

  // Reactivate deadline
  const reactivateDeadline = useCallback(async (id: string) => {
    return updateDeadline(id, { 
      status: 'active',
      completed_at: null,
    });
  }, [updateDeadline]);

  // Delete deadline
  const deleteDeadline = useCallback(async (id: string) => {
    try {
      // Delete associated reminders first
      await supabase
        .from('reminders')
        .delete()
        .eq('entity_type', 'client_deadline')
        .eq('entity_id', id);

      const { error } = await supabase
        .from('client_deadlines')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeadlines(prev => prev.filter(d => d.id !== id));

      toast({
        title: 'נמחק בהצלחה',
      });

      return true;
    } catch (error) {
      console.error('Error deleting deadline:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן למחוק',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Create custom template
  const createTemplate = useCallback(async (templateData: Omit<DeadlineTemplate, 'id' | 'user_id' | 'is_system' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('deadline_templates')
        .insert({
          ...templateData,
          user_id: user.id,
          is_system: false,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates(prev => [...prev, data as DeadlineTemplate]);

      toast({
        title: 'תבנית נשמרה',
      });

      return data as DeadlineTemplate;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לשמור תבנית',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Delete custom template
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('deadline_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTemplates(prev => prev.filter(t => t.id !== id));

      toast({
        title: 'תבנית נמחקה',
      });

      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      return false;
    }
  }, [toast]);

  // Get stats
  const getStats = useCallback(() => {
    const active = deadlines.filter(d => d.status === 'active');
    const overdue = deadlines.filter(d => d.status === 'overdue' || (d.status === 'active' && d.days_remaining === 0));
    const danger = active.filter(d => d.urgency === 'danger');
    const warning = active.filter(d => d.urgency === 'warning');
    const completed = deadlines.filter(d => d.status === 'completed');

    return {
      total: deadlines.length,
      active: active.length,
      overdue: overdue.length,
      danger: danger.length,
      warning: warning.length,
      completed: completed.length,
    };
  }, [deadlines]);

  // Initial fetch
  useEffect(() => {
    fetchDeadlines();
    fetchTemplates();
  }, [fetchDeadlines, fetchTemplates]);

  return {
    deadlines,
    templates,
    loading,
    fetchDeadlines,
    createDeadline,
    updateDeadline,
    completeDeadline,
    cancelDeadline,
    reactivateDeadline,
    deleteDeadline,
    createTemplate,
    deleteTemplate,
    getStats,
  };
}

export default useClientDeadlines;
