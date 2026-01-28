// useActivityLog Hook - Automatic activity logging
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type EntityType = 
  | 'clients' 
  | 'projects' 
  | 'time_entries' 
  | 'profiles' 
  | 'user'
  | 'tasks'
  | 'meetings'
  | 'reminders'
  | 'quotes'
  | 'invoices'
  | 'payments'
  | 'files'
  | 'settings'
  | 'custom_tables'
  | 'backups';

type ActionType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'view' 
  | 'login' 
  | 'logout'
  | 'complete'
  | 'archive'
  | 'restore'
  | 'send'
  | 'payment'
  | 'status_change';

interface LogActivityParams {
  action: ActionType;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
}

export function useActivityLog() {
  const { user } = useAuth();

  const logActivity = useCallback(async ({
    action,
    entityType,
    entityId,
    details,
  }: LogActivityParams) => {
    try {
      const { error } = await supabase.from('activity_log').insert({
        user_id: user?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        details: details || null,
        ip_address: null, // Could be fetched from an API if needed
      });

      if (error) {
        console.error('Error logging activity:', error);
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  }, [user?.id]);

  // Convenience methods
  const logCreate = useCallback((entityType: EntityType, entityId: string, details?: Record<string, any>) => {
    return logActivity({ action: 'create', entityType, entityId, details });
  }, [logActivity]);

  const logUpdate = useCallback((entityType: EntityType, entityId: string, details?: Record<string, any>) => {
    return logActivity({ action: 'update', entityType, entityId, details });
  }, [logActivity]);

  const logDelete = useCallback((entityType: EntityType, entityId: string, details?: Record<string, any>) => {
    return logActivity({ action: 'delete', entityType, entityId, details });
  }, [logActivity]);

  const logView = useCallback((entityType: EntityType, entityId?: string, details?: Record<string, any>) => {
    return logActivity({ action: 'view', entityType, entityId, details });
  }, [logActivity]);

  return {
    logActivity,
    logCreate,
    logUpdate,
    logDelete,
    logView,
  };
}