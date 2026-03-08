import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CustomColumn } from '@/components/tables/AddColumnDialog';

interface DataTypeOption {
  value: string;
  label: string;
  color?: string;
}

export function useTableCustomColumns(tableName: string) {
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataTypeOptions, setDataTypeOptions] = useState<Record<string, DataTypeOption[]>>({});
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID for created_by field
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  // Fetch custom columns for this table
  const fetchColumns = useCallback(async () => {
    setIsLoading(true);
    
    const { data, error } = await supabase
      .from('table_custom_columns')
      .select(`
        *,
        data_types(
          name,
          display_name,
          source_table,
          display_field,
          color,
          type_mode,
          options
        )
      `)
      .eq('table_name', tableName)
      .order('column_order');

    if (error) {
      console.error('Error fetching custom columns:', error);
      setIsLoading(false);
      return;
    }

    const columns = (data || []).map((col: any) => ({
      id: col.id,
      table_name: col.table_name,
      column_key: col.column_key,
      column_name: col.column_name,
      column_type: col.column_type,
      column_options: col.column_options || [],
      data_type_id: col.data_type_id,
      is_required: col.is_required,
      default_value: col.default_value,
      column_order: col.column_order,
      // Include linked data type info
      _data_type: col.data_types,
    }));

    setCustomColumns(columns);

    // Fetch options for data type columns
    const dataTypeColumns = columns.filter((c: any) => c.column_type === 'data_type' && c._data_type);
    const optionsMap: Record<string, DataTypeOption[]> = {};

    for (const col of dataTypeColumns) {
      const dt = (col as any)._data_type;
      if (!dt) continue;

      try {
        // OPTIONS MODE: Use static options directly from the data type
        if (dt.type_mode === 'options' && dt.options && Array.isArray(dt.options) && dt.options.length > 0) {
          optionsMap[col.column_key] = dt.options.map((opt: any) => ({
            value: opt.value,
            label: opt.label,
            color: opt.color || dt.color,
          }));
          continue;
        }

        // LINKED MODE: Fetch from source table
        if (dt.type_mode === 'linked' && dt.source_table && dt.display_field) {
          const { data: options } = await supabase
            .from(dt.source_table)
            .select(`id, ${dt.display_field}`)
            .limit(100);

          if (options) {
            optionsMap[col.column_key] = options.map((opt: any) => ({
              value: opt.id,
              label: opt[dt.display_field] || opt.id,
              color: dt.color,
            }));
          }
        }
      } catch (err) {
        console.error(`Error fetching options for ${col.column_key}:`, err);
      }
    }

    setDataTypeOptions(optionsMap);
    setIsLoading(false);
  }, [tableName]);

  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  // Add a new column (refresh from DB to get full data with joins)
  const addColumn = useCallback(async (column: CustomColumn) => {
    // The column was already saved by AddColumnDialog, just refresh to get full data
    await fetchColumns();
  }, [fetchColumns]);

  // Add multiple columns at once (bulk operation)
  const addColumnsInBulk = useCallback(async (
    columns: CustomColumn[],
    groupName?: string
  ) => {
    if (!userId) {
      console.error('❌ No user ID available');
      return { data: null, error: new Error('User not authenticated') };
    }

    const columnsToInsert = columns.map((col, index) => ({
      table_name: tableName,
      column_key: col.column_key,
      column_name: col.column_name,
      column_type: col.column_type,
      column_options: col.column_options || null,
      data_type_id: col.data_type_id || null,
      is_required: col.is_required || false,
      default_value: col.default_value || null,
      column_order: col.column_order || ((customColumns.length || 0) + index),
      column_group: groupName || null,
      allow_multiple: col.allow_multiple || false,
      formula: col.formula || null,
      max_rating: col.max_rating || null,
      created_by: userId,
    }));

    const { data, error } = await supabase
      .from('table_custom_columns')
      .insert(columnsToInsert)
      .select('*');

    if (!error && data) {
      await fetchColumns(); // Refresh to get full data with joins
    }

    return { data, error };
  }, [tableName, customColumns, fetchColumns, userId]);

  // Delete a column (cannot delete required columns)
  const deleteColumn = useCallback(async (columnId: string) => {
    // Check if column is required
    const column = customColumns.find(c => c.id === columnId);
    if (column?.is_required) {
      console.log('❌ Cannot delete required column:', column.column_name);
      return { error: { message: 'לא ניתן למחוק עמודת חובה' } };
    }
    
    console.log('🗑️ Attempting to delete column:', columnId);
    
    const { error } = await supabase
      .from('table_custom_columns')
      .delete()
      .eq('id', columnId);

    if (error) {
      console.error('❌ Error deleting column:', error);
    } else {
      console.log('✅ Column deleted successfully');
      setCustomColumns(prev => prev.filter(c => c.id !== columnId));
    }

    return { error };
  }, [customColumns]);

  // Update column order
  const updateColumnOrder = useCallback(async (columnId: string, newOrder: number) => {
    const { error } = await supabase
      .from('table_custom_columns')
      .update({ column_order: newOrder })
      .eq('id', columnId);

    if (!error) {
      setCustomColumns(prev => 
        prev.map(c => c.id === columnId ? { ...c, column_order: newOrder } : c)
          .sort((a, b) => (a.column_order || 0) - (b.column_order || 0))
      );
    }

    return { error };
  }, []);

  // Update column required status
  const updateColumnRequired = useCallback(async (columnId: string, isRequired: boolean) => {
    console.log('🔄 Updating column required status:', columnId, isRequired);
    
    const { error } = await supabase
      .from('table_custom_columns')
      .update({ is_required: isRequired })
      .eq('id', columnId);

    if (error) {
      console.error('❌ Error updating column required status:', error);
    } else {
      console.log('✅ Column required status updated successfully');
      setCustomColumns(prev => 
        prev.map(c => c.id === columnId ? { ...c, is_required: isRequired } : c)
      );
    }

    return { error };
  }, []);

  // Get display value for a data type linked value
  const getDataTypeDisplayValue = useCallback((columnKey: string, value: string) => {
    const options = dataTypeOptions[columnKey] || [];
    const option = options.find(o => o.value === value);
    return option?.label || value || '';
  }, [dataTypeOptions]);

  return {
    customColumns,
    isLoading,
    dataTypeOptions,
    addColumn,
    addColumnsInBulk,
    deleteColumn,
    updateColumnOrder,
    updateColumnRequired,
    getDataTypeDisplayValue,
    refetch: fetchColumns,
  };
}

// Hook to update custom_data in a record
export function useCustomData<T extends { id: string; custom_data?: Record<string, any> }>(
  tableName: string,
  records: T[],
  setRecords: React.Dispatch<React.SetStateAction<T[]>>
) {
  const updateCustomData = useCallback(async (
    recordId: string,
    columnKey: string,
    value: any
  ) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return { error: new Error('Record not found') };

    const newCustomData = {
      ...(record.custom_data || {}),
      [columnKey]: value,
    };

    const { error } = await supabase
      .from(tableName as 'profiles' | 'time_entries' | 'projects')
      .update({ custom_data: newCustomData } as any)
      .eq('id', recordId);

    if (!error) {
      setRecords(prev => 
        prev.map(r => r.id === recordId 
          ? { ...r, custom_data: newCustomData } 
          : r
        )
      );
    }

    return { error };
  }, [tableName, records, setRecords]);

  return { updateCustomData };
}
