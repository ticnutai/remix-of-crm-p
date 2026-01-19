// Hook for managing client custom tabs (data type based tabs)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface ClientCustomTab {
  id: string;
  data_type_id: string;
  data_type_ids?: string[]; // Support for multiple data types
  display_name: string;
  icon: string | null;
  display_mode: 'table' | 'cards' | 'both';
  column_order: string[];
  is_global: boolean;
  client_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Folder support
  folder_name?: string | null;
  folder_order?: number | null;
  // Enhanced tab features
  tab_type?: 'data_type' | 'custom_table';
  table_columns?: any[];
  show_summary?: boolean;
  show_analysis?: boolean;
  allow_files?: boolean;
  grid_layout?: boolean;
  // Joined data
  data_type?: {
    id: string;
    name: string;
    display_name: string;
    icon: string | null;
    color: string | null;
    source_type: string;
    source_table: string;
    display_field: string;
  };
}

export interface CreateTabInput {
  data_type_id?: string; // Single data type (backwards compatibility)
  data_type_ids?: string[]; // Multiple data types
  display_name: string;
  icon?: string;
  display_mode?: 'table' | 'cards' | 'both';
  is_global?: boolean;
  client_id?: string;
}

export function useClientCustomTabs(clientId?: string) {
  const { user, isAdmin, isManager } = useAuth();
  const [tabs, setTabs] = useState<ClientCustomTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canManage = isAdmin || isManager;

  // Fetch tabs for current client (global + client-specific)
  const fetchTabs = useCallback(async () => {
    if (!user) {
      setTabs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = supabase
        .from('client_custom_tabs')
        .select(`
          *,
          data_type:data_types (
            id,
            name,
            display_name,
            icon,
            color,
            source_type,
            source_table,
            display_field
          )
        `)
        .eq('is_active', true)
        .order('sort_order');

      // Get global tabs + client-specific tabs
      if (clientId) {
        query = query.or(`is_global.eq.true,client_id.eq.${clientId}`);
      } else {
        query = query.eq('is_global', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Parse column_order from JSONB
      const parsedTabs = (data || []).map(tab => ({
        ...tab,
        column_order: Array.isArray(tab.column_order) ? tab.column_order : [],
      })) as ClientCustomTab[];
      
      setTabs(parsedTabs);
    } catch (error) {
      console.error('Error fetching client custom tabs:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את הטאבים המותאמים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, clientId]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  // Create a new tab
  const createTab = useCallback(async (input: CreateTabInput) => {
    if (!user || !canManage) return null;

    try {
      // Prepare data for insertion
      const insertData: any = {
        display_name: input.display_name,
        icon: input.icon,
        display_mode: input.display_mode || 'table',
        is_global: input.is_global || false,
        client_id: input.client_id,
        created_by: user.id,
      };

      // Support both single and multiple data types
      if (input.data_type_ids && input.data_type_ids.length > 0) {
        // Multiple data types - store as array
        insertData.data_type_ids = input.data_type_ids;
        // For backwards compatibility, store first one in data_type_id
        insertData.data_type_id = input.data_type_ids[0];
      } else if (input.data_type_id) {
        // Single data type
        insertData.data_type_id = input.data_type_id;
        insertData.data_type_ids = [input.data_type_id];
      } else {
        throw new Error('חובה לבחור לפחות סוג נתונים אחד');
      }

      const { data, error } = await supabase
        .from('client_custom_tabs')
        .insert(insertData)
        .select(`
          *,
          data_type:data_types (
            id,
            name,
            display_name,
            icon,
            color,
            source_type,
            source_table,
            display_field
          )
        `)
        .single();

      if (error) throw error;

      toast({
        title: 'טאב נוצר בהצלחה',
        description: `הטאב "${input.display_name}" נוסף`,
      });

      await fetchTabs();
      return data;
    } catch (error: any) {
      console.error('Error creating tab:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן ליצור את הטאב',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, canManage, fetchTabs]);

  // Update a tab
  const updateTab = useCallback(async (tabId: string, updates: Partial<ClientCustomTab>) => {
    if (!user || !canManage) return false;

    try {
      const { error } = await supabase
        .from('client_custom_tabs')
        .update(updates)
        .eq('id', tabId);

      if (error) throw error;

      toast({
        title: 'טאב עודכן',
        description: 'השינויים נשמרו בהצלחה',
      });

      await fetchTabs();
      return true;
    } catch (error: any) {
      console.error('Error updating tab:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לעדכן את הטאב',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, canManage, fetchTabs]);

  // Delete a tab
  const deleteTab = useCallback(async (tabId: string) => {
    if (!user || !canManage) return false;

    try {
      const { error } = await supabase
        .from('client_custom_tabs')
        .delete()
        .eq('id', tabId);

      if (error) throw error;

      toast({
        title: 'טאב נמחק',
        description: 'הטאב הוסר בהצלחה',
      });

      await fetchTabs();
      return true;
    } catch (error: any) {
      console.error('Error deleting tab:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן למחוק את הטאב',
        variant: 'destructive',
      });
      return false;
    }
  }, [user, canManage, fetchTabs]);

  // Fetch data for a specific tab based on its data type
  const fetchTabData = useCallback(async (tab: ClientCustomTab, entityId: string) => {
    if (!tab.data_type) return [];

    try {
      const dataType = tab.data_type;
      
      // Determine which column to use based on the data type
      const query = supabase.from(dataType.source_table as any).select('*');
      
      // For clients source table, we need to handle differently
      if (dataType.source_table === 'clients') {
        // If we're showing clients related data, we might want to filter by linked_client_id in custom tables
        // For now, just return empty since clients viewing their own related clients doesn't make sense
        return [];
      }
      
      // Try to find a client_id column
      const { data, error } = await query.eq('client_id', entityId).limit(100);
      
      if (error) {
        // If client_id doesn't exist, try linked_client_id
        const { data: data2, error: error2 } = await supabase
          .from(dataType.source_table as any)
          .select('*')
          .eq('linked_client_id', entityId)
          .limit(100);
        
        if (error2) {
          console.error('Error fetching tab data:', error2);
          return [];
        }
        
        return data2 || [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching tab data:', error);
      return [];
    }
  }, []);

  return {
    tabs,
    isLoading,
    canManage,
    createTab,
    updateTab,
    deleteTab,
    fetchTabData,
    refetch: fetchTabs,
  };
}

// Hook to get all global tabs (for sidebar/management)
export function useGlobalCustomTabs() {
  const { user, isAdmin, isManager } = useAuth();
  const [tabs, setTabs] = useState<ClientCustomTab[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canManage = isAdmin || isManager;

  const fetchTabs = useCallback(async () => {
    if (!user) {
      setTabs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_custom_tabs')
        .select(`
          *,
          data_type:data_types (
            id,
            name,
            display_name,
            icon,
            color,
            source_type,
            source_table,
            display_field
          )
        `)
        .eq('is_global', true)
        .order('sort_order');

      if (error) throw error;
      
      const parsedTabs = (data || []).map(tab => ({
        ...tab,
        column_order: Array.isArray(tab.column_order) ? tab.column_order : [],
      })) as ClientCustomTab[];
      
      setTabs(parsedTabs);
    } catch (error) {
      console.error('Error fetching global custom tabs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTabs();
  }, [fetchTabs]);

  return {
    tabs,
    isLoading,
    canManage,
    refetch: fetchTabs,
  };
}
