import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface TableColumn {
  id: string;
  name: string;
  displayName: string;
  type: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'client' | 'data_type';
  options?: string[]; // For select type
  required?: boolean;
  defaultValue?: string;
  dataTypeId?: string; // For data_type type
}

export interface CustomTable {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string | null;
  columns: TableColumn[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomTableData {
  id: string;
  table_id: string;
  data: Record<string, any>;
  linked_client_id?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TablePermission {
  id: string;
  table_id: string;
  user_id: string;
  can_view: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function useCustomTables() {
  const [tables, setTables] = useState<CustomTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();

  const fetchTables = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_tables')
        .select('*')
        .order('display_name');
      
      if (error) throw error;
      
      // Parse columns from JSONB
      const parsedTables = (data || []).map(table => ({
        ...table,
        columns: typeof table.columns === 'string' 
          ? JSON.parse(table.columns) 
          : table.columns || []
      })) as CustomTable[];
      
      setTables(parsedTables);
    } catch (error) {
      console.error('Error fetching custom tables:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const createTable = async (tableData: {
    name: string;
    display_name: string;
    icon?: string;
    description?: string;
    columns: TableColumn[];
  }) => {
    if (!user || (!isAdmin && !isManager)) {
      toast({
        title: 'שגיאה',
        description: 'אין לך הרשאה ליצור טבלאות',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const insertData = {
        name: tableData.name,
        display_name: tableData.display_name,
        icon: tableData.icon || 'Table',
        description: tableData.description || null,
        columns: JSON.stringify(tableData.columns),
        created_by: user.id,
      };
      
      const { data, error } = await supabase
        .from('custom_tables')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;

      const newTable = {
        ...data,
        columns: (Array.isArray(data.columns) ? data.columns : []) as unknown as TableColumn[]
      } as CustomTable;

      setTables(prev => [...prev, newTable]);
      
      toast({
        title: 'טבלה נוצרה',
        description: `הטבלה "${tableData.display_name}" נוצרה בהצלחה`,
      });

      return newTable;
    } catch (error: any) {
      console.error('Error creating table:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן ליצור את הטבלה',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateTable = async (tableId: string, updates: Partial<Omit<CustomTable, 'columns'>> & { columns?: TableColumn[] }) => {
    try {
      const updatePayload: Record<string, unknown> = { ...updates };
      if (updates.columns) {
        updatePayload.columns = updates.columns as unknown as Record<string, unknown>;
      }
      
      const { error } = await supabase
        .from('custom_tables')
        .update(updatePayload)
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.map(t => 
        t.id === tableId ? { ...t, ...updates } : t
      ));

      toast({
        title: 'עודכן',
        description: 'הטבלה עודכנה בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error updating table:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לעדכן את הטבלה',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('custom_tables')
        .delete()
        .eq('id', tableId);

      if (error) throw error;

      setTables(prev => prev.filter(t => t.id !== tableId));

      toast({
        title: 'נמחק',
        description: 'הטבלה נמחקה בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן למחוק את הטבלה',
        variant: 'destructive',
      });
      return false;
    }
  };

  // Add a column to a table
  const addColumn = async (tableId: string, column: TableColumn) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return false;

    const newColumns = [...table.columns, column];
    return updateTable(tableId, { columns: newColumns });
  };

  // Update a column in a table
  const updateColumn = async (tableId: string, columnId: string, updates: Partial<TableColumn>) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return false;

    const newColumns = table.columns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    );
    return updateTable(tableId, { columns: newColumns });
  };

  // Delete a column from a table
  const deleteColumn = async (tableId: string, columnId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return false;

    const newColumns = table.columns.filter(col => col.id !== columnId);
    return updateTable(tableId, { columns: newColumns });
  };

  // Duplicate a table with all its data
  const duplicateTable = async (tableId: string) => {
    const sourceTable = tables.find(t => t.id === tableId);
    if (!sourceTable || !user) return null;

    try {
      // Create new table with copied settings
      const newTableData = {
        name: `${sourceTable.name}_copy_${Date.now()}`,
        display_name: `${sourceTable.display_name} (עותק)`,
        icon: sourceTable.icon,
        description: sourceTable.description || undefined,
        columns: sourceTable.columns,
      };

      const newTable = await createTable(newTableData);
      if (!newTable) return null;

      // Copy all data from source table
      const { data: sourceData, error: fetchError } = await supabase
        .from('custom_table_data')
        .select('data')
        .eq('table_id', tableId);

      if (fetchError) throw fetchError;

      if (sourceData && sourceData.length > 0) {
        const newDataRows = sourceData.map(row => ({
          table_id: newTable.id,
          data: row.data,
          created_by: user.id,
        }));

        const { error: insertError } = await supabase
          .from('custom_table_data')
          .insert(newDataRows);

        if (insertError) throw insertError;
      }

      toast({
        title: 'שוכפל בהצלחה',
        description: `הטבלה "${sourceTable.display_name}" שוכפלה עם ${sourceData?.length || 0} רשומות`,
      });

      return newTable;
    } catch (error: any) {
      console.error('Error duplicating table:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לשכפל את הטבלה',
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    tables,
    isLoading,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    addColumn,
    updateColumn,
    deleteColumn,
    duplicateTable,
    canManage: isAdmin || isManager,
  };
}

export function useCustomTableData(tableId: string | null) {
  const [data, setData] = useState<CustomTableData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    if (!tableId || !user) return;
    
    setIsLoading(true);
    try {
      const { data: tableData, error } = await supabase
        .from('custom_table_data')
        .select('*')
        .eq('table_id', tableId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setData(tableData as CustomTableData[]);
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [tableId, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addRow = async (rowData: Record<string, any>, linkedClientId?: string) => {
    if (!tableId || !user) return null;

    try {
      const insertData: any = {
        table_id: tableId,
        data: rowData,
        created_by: user.id,
      };
      
      if (linkedClientId) {
        insertData.linked_client_id = linkedClientId;
      }

      const { data: newRow, error } = await supabase
        .from('custom_table_data')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setData(prev => [newRow as CustomTableData, ...prev]);
      
      toast({
        title: 'נוסף',
        description: 'הרשומה נוספה בהצלחה',
      });

      return newRow;
    } catch (error: any) {
      console.error('Error adding row:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן להוסיף את הרשומה',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateRow = async (rowId: string, rowData: Record<string, any>, linkedClientId?: string | null) => {
    try {
      const updateData: any = { data: rowData };
      
      // Update linked_client_id if provided
      if (linkedClientId !== undefined) {
        updateData.linked_client_id = linkedClientId;
      }

      const { error } = await supabase
        .from('custom_table_data')
        .update(updateData)
        .eq('id', rowId);

      if (error) throw error;

      setData(prev => prev.map(row => 
        row.id === rowId ? { ...row, data: rowData, linked_client_id: linkedClientId ?? row.linked_client_id } : row
      ));

      return true;
    } catch (error: any) {
      console.error('Error updating row:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לעדכן את הרשומה',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteRow = async (rowId: string) => {
    try {
      const { error } = await supabase
        .from('custom_table_data')
        .delete()
        .eq('id', rowId);

      if (error) throw error;

      setData(prev => prev.filter(row => row.id !== rowId));

      toast({
        title: 'נמחק',
        description: 'הרשומה נמחקה בהצלחה',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting row:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן למחוק את הרשומה',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteMultipleRows = async (rowIds: string[]) => {
    try {
      const { error } = await supabase
        .from('custom_table_data')
        .delete()
        .in('id', rowIds);

      if (error) throw error;

      setData(prev => prev.filter(row => !rowIds.includes(row.id)));

      toast({
        title: 'נמחק',
        description: `${rowIds.length} רשומות נמחקו בהצלחה`,
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting rows:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן למחוק את הרשומות',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    data,
    isLoading,
    fetchData,
    addRow,
    updateRow,
    deleteRow,
    deleteMultipleRows,
  };
}
