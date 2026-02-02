import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ClientTabColumn {
  id: string;
  tab_id: string;
  column_key: string;
  column_name: string;
  column_type: string;
  column_options: any[];
  data_type_id: string | null;
  is_required: boolean;
  default_value: string | null;
  column_order: number;
  column_group: string | null;
  allow_multiple: boolean;
  max_rating: number;
  formula: string | null;
  column_width: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewColumnData {
  column_name: string;
  column_type: string;
  column_key?: string; // אופציונלי - אם לא נשלח, יווצר אוטומטית
  column_options?: any[];
  data_type_id?: string | null;
  is_required?: boolean;
  default_value?: string | null;
  column_group?: string | null;
  allow_multiple?: boolean;
  max_rating?: number;
  formula?: string | null;
  column_width?: number | null;
}

export function useClientTabColumns(tabId: string) {
  const [columns, setColumns] = useState<ClientTabColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isManager } = useAuth();

  const canEdit = isAdmin || isManager;

  const fetchColumns = useCallback(async () => {
    if (!tabId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_tab_columns')
        .select('*')
        .eq('tab_id', tabId)
        .order('column_order', { ascending: true });

      if (error) throw error;
      
      // Parse column_options if needed
      const parsedData = (data || []).map(col => ({
        ...col,
        column_options: Array.isArray(col.column_options) 
          ? col.column_options 
          : (col.column_options ? JSON.parse(col.column_options as string) : [])
      }));
      
      setColumns(parsedData);
    } catch (error) {
      console.error('Error fetching tab columns:', error);
      toast.error('שגיאה בטעינת עמודות');
    } finally {
      setIsLoading(false);
    }
  }, [tabId]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  const generateColumnKey = (name: string): string => {
    const base = name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30);
    return `${base}_${Date.now().toString(36)}`;
  };

  const addColumn = async (columnData: NewColumnData): Promise<ClientTabColumn | null> => {
    if (!user || !canEdit) {
      toast.error('אין לך הרשאה להוסיף עמודות');
      return null;
    }

    try {
      const columnKey = generateColumnKey(columnData.column_name);
      const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.column_order)) + 1 : 0;

      const { data, error } = await supabase
        .from('client_tab_columns')
        .insert({
          tab_id: tabId,
          column_key: columnKey,
          column_name: columnData.column_name,
          column_type: columnData.column_type,
          column_options: columnData.column_options || [],
          data_type_id: columnData.data_type_id || null,
          is_required: columnData.is_required || false,
          default_value: columnData.default_value || null,
          column_order: maxOrder,
          column_group: columnData.column_group || null,
          allow_multiple: columnData.allow_multiple || false,
          max_rating: columnData.max_rating || 5,
          formula: columnData.formula || null,
          column_width: columnData.column_width || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('העמודה נוספה בהצלחה');
      await fetchColumns();
      
      // Parse column_options for return value
      const parsedData: ClientTabColumn = {
        ...data,
        column_options: Array.isArray(data.column_options) 
          ? data.column_options 
          : (data.column_options ? JSON.parse(data.column_options as string) : [])
      };
      return parsedData;
    } catch (error) {
      console.error('Error adding column:', error);
      toast.error('שגיאה בהוספת עמודה');
      return null;
    }
  };

  const addColumnsInBulk = async (
    columnsData: NewColumnData[], 
    groupName?: string
  ): Promise<boolean> => {
    if (!user || !canEdit) {
      console.error('No permission to add columns:', { user: !!user, canEdit, isAdmin, isManager });
      toast.error('אין לך הרשאה להוסיף עמודות');
      return false;
    }

    try {
      const maxOrder = columns.length > 0 ? Math.max(...columns.map(c => c.column_order)) : -1;

      const columnsToInsert = columnsData.map((col, index) => ({
        tab_id: tabId,
        // אם יש column_key, השתמש בו, אחרת צור חדש
        column_key: col.column_key || generateColumnKey(col.column_name),
        column_name: col.column_name,
        column_type: col.column_type,
        column_options: col.column_options || [],
        data_type_id: col.data_type_id || null,
        is_required: col.is_required || false,
        default_value: col.default_value || null,
        column_order: maxOrder + index + 1,
        column_group: groupName || col.column_group || null,
        allow_multiple: col.allow_multiple || false,
        max_rating: col.max_rating || 5,
        formula: col.formula || null,
        column_width: col.column_width || null,
        created_by: user.id
      }));

      console.log('Adding columns in bulk:', columnsToInsert);

      const { data, error } = await supabase
        .from('client_tab_columns')
        .insert(columnsToInsert)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Columns added successfully:', data);
      toast.success(`${columnsData.length} עמודות נוספו בהצלחה`);
      await fetchColumns();
      return true;
    } catch (error) {
      console.error('Error adding columns in bulk:', error);
      toast.error('שגיאה בהוספת עמודות');
      return false;
    }
  };

  const updateColumn = async (
    columnId: string, 
    updates: Partial<NewColumnData>
  ): Promise<boolean> => {
    if (!user || !canEdit) {
      toast.error('אין לך הרשאה לעדכן עמודות');
      return false;
    }

    try {
      const { error } = await supabase
        .from('client_tab_columns')
        .update(updates)
        .eq('id', columnId);

      if (error) throw error;

      toast.success('העמודה עודכנה בהצלחה');
      await fetchColumns();
      return true;
    } catch (error) {
      console.error('Error updating column:', error);
      toast.error('שגיאה בעדכון עמודה');
      return false;
    }
  };

  const deleteColumn = async (columnId: string): Promise<boolean> => {
    if (!user || !canEdit) {
      toast.error('אין לך הרשאה למחוק עמודות');
      return false;
    }

    try {
      const { error } = await supabase
        .from('client_tab_columns')
        .delete()
        .eq('id', columnId);

      if (error) throw error;

      toast.success('העמודה נמחקה בהצלחה');
      await fetchColumns();
      return true;
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error('שגיאה במחיקת עמודה');
      return false;
    }
  };

  const reorderColumns = async (columnIds: string[]): Promise<boolean> => {
    if (!user || !canEdit) {
      toast.error('אין לך הרשאה לשנות סדר עמודות');
      return false;
    }

    try {
      const updates = columnIds.map((id, index) => ({
        id,
        column_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('client_tab_columns')
          .update({ column_order: update.column_order })
          .eq('id', update.id);
      }

      await fetchColumns();
      return true;
    } catch (error) {
      console.error('Error reordering columns:', error);
      toast.error('שגיאה בשינוי סדר עמודות');
      return false;
    }
  };

  return {
    columns,
    isLoading,
    canEdit,
    addColumn,
    addColumnsInBulk,
    updateColumn,
    deleteColumn,
    reorderColumns,
    refetch: fetchColumns
  };
}
