import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useUndoRedo } from '@/hooks/useUndoRedo';

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

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  meeting_type: string;
  status: string;
  created_by: string;
  client_id: string | null;
  project_id: string | null;
  attendees: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { name: string } | null;
  project?: { name: string } | null;
  creator?: { full_name: string } | null;
}

export interface MeetingInsert {
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  location?: string | null;
  meeting_type?: string;
  status?: string;
  client_id?: string | null;
  project_id?: string | null;
  attendees?: string[];
  notes?: string | null;
}

export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { pushAction } = useUndoRedo();

  const fetchMeetings = useCallback(async (startDate?: Date, endDate?: Date) => {
    if (!user) return;
    
    setLoading(true);
    let query = supabase
      .from('meetings')
      .select(`
        *,
        client:clients(name),
        project:projects(name)
      `)
      .order('start_time', { ascending: true });

    if (startDate) {
      query = query.gte('start_time', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('start_time', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לטעון את הפגישות',
        variant: 'destructive',
      });
    } else {
      setMeetings((data as Meeting[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  const createMeeting = useCallback(async (meeting: MeetingInsert) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        ...meeting,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating meeting:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו ליצור את הפגישה',
        variant: 'destructive',
      });
      return null;
    }

    const createdMeeting = data as Meeting;

    // Log activity
    logToActivityLog(user.id, 'create', 'meetings', createdMeeting.id, { title: meeting.title });

    // Add undo/redo action
    pushAction({
      type: 'create_meeting',
      description: `יצירת פגישה: ${meeting.title}`,
      undo: async () => {
        await supabase.from('meetings').delete().eq('id', createdMeeting.id);
        await fetchMeetings();
      },
      redo: async () => {
        await supabase.from('meetings').insert({ ...meeting, created_by: user.id });
        await fetchMeetings();
      },
    });

    toast({
      title: 'הפגישה נוצרה',
      description: meeting.title,
    });

    await fetchMeetings();
    return createdMeeting;
  }, [user, toast, fetchMeetings, pushAction]);

  const updateMeeting = useCallback(async (id: string, updates: Partial<MeetingInsert>) => {
    // Get original meeting data for undo
    const originalMeeting = meetings.find(m => m.id === id);
    if (!originalMeeting) return false;

    const { error } = await supabase
      .from('meetings')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating meeting:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו לעדכן את הפגישה',
        variant: 'destructive',
      });
      return false;
    }

    // Log activity
    logToActivityLog(user?.id, 'update', 'meetings', id, { title: originalMeeting.title, changes: updates });

    // Add undo/redo action
    pushAction({
      type: 'update_meeting',
      description: `עדכון פגישה: ${originalMeeting.title}`,
      undo: async () => {
        await supabase.from('meetings').update({
          title: originalMeeting.title,
          description: originalMeeting.description,
          start_time: originalMeeting.start_time,
          end_time: originalMeeting.end_time,
          location: originalMeeting.location,
          meeting_type: originalMeeting.meeting_type,
          status: originalMeeting.status,
          client_id: originalMeeting.client_id,
          project_id: originalMeeting.project_id,
          attendees: originalMeeting.attendees,
          notes: originalMeeting.notes,
        }).eq('id', id);
        await fetchMeetings();
      },
      redo: async () => {
        await supabase.from('meetings').update(updates).eq('id', id);
        await fetchMeetings();
      },
    });

    toast({
      title: 'הפגישה עודכנה',
    });

    await fetchMeetings();
    return true;
  }, [toast, fetchMeetings, meetings, pushAction]);

  const deleteMeeting = useCallback(async (id: string) => {
    // Get original meeting data for undo
    const originalMeeting = meetings.find(m => m.id === id);
    if (!originalMeeting) return false;

    const { error } = await supabase
      .from('meetings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting meeting:', error);
      toast({
        title: 'שגיאה',
        description: 'לא הצלחנו למחוק את הפגישה',
        variant: 'destructive',
      });
      return false;
    }

    // Log activity
    logToActivityLog(user?.id, 'delete', 'meetings', id, { title: originalMeeting.title });

    // Add undo/redo action
    pushAction({
      type: 'delete_meeting',
      description: `מחיקת פגישה: ${originalMeeting.title}`,
      undo: async () => {
        await supabase.from('meetings').insert({
          id: originalMeeting.id,
          title: originalMeeting.title,
          description: originalMeeting.description,
          start_time: originalMeeting.start_time,
          end_time: originalMeeting.end_time,
          location: originalMeeting.location,
          meeting_type: originalMeeting.meeting_type,
          status: originalMeeting.status,
          client_id: originalMeeting.client_id,
          project_id: originalMeeting.project_id,
          attendees: originalMeeting.attendees,
          notes: originalMeeting.notes,
          created_by: originalMeeting.created_by,
        });
        await fetchMeetings();
      },
      redo: async () => {
        await supabase.from('meetings').delete().eq('id', id);
        await fetchMeetings();
      },
    });

    toast({
      title: 'הפגישה נמחקה',
    });

    await fetchMeetings();
    return true;
  }, [toast, fetchMeetings, meetings, pushAction]);

  useEffect(() => {
    if (user) {
      fetchMeetings();
    }
  }, [user, fetchMeetings]);

  return {
    meetings,
    loading,
    fetchMeetings,
    createMeeting,
    updateMeeting,
    deleteMeeting,
  };
}
