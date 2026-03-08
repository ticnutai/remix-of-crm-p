// useDataTypes - Hook for managing data types and linked data
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { DataTypeConfig, DataTypeSelectOption, DataTypeOption, DataTypeMode } from '@/types/dataTypes';
import { Json } from '@/integrations/supabase/types';

// Helper to parse options from database JSON
function parseOptions(options: Json | null): DataTypeSelectOption[] {
  if (!options || !Array.isArray(options)) return [];
  return options.map((opt: any) => ({
    value: opt.value || '',
    label: opt.label || '',
    color: opt.color,
    icon: opt.icon,
  }));
}

export function useDataTypes() {
  const { user, isAdmin, isManager } = useAuth();
  const [dataTypes, setDataTypes] = useState<DataTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const canManage = isAdmin || isManager;

  // Fetch all data types (system + custom)
  const fetchDataTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_types')
        .select('*')
        .order('source_type', { ascending: false }) // System first
        .order('display_name');

      if (error) throw error;
      
      // Map database response to DataTypeConfig
      const mapped: DataTypeConfig[] = (data || []).map((item) => ({
        id: item.id,
        name: item.name,
        display_name: item.display_name,
        icon: item.icon || 'Database',
        color: item.color || '#1e3a5f',
        source_type: item.source_type as 'system' | 'custom',
        type_mode: (item.type_mode || 'linked') as DataTypeMode,
        source_table: item.source_table,
        display_field: item.display_field,
        options: parseOptions(item.options),
        description: item.description || undefined,
        created_by: item.created_by,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setDataTypes(mapped);
    } catch (error) {
      console.error('Error fetching data types:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את סוגי הנתונים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDataTypes();
    }
  }, [user, fetchDataTypes]);

  // Get system data types
  const systemDataTypes = useMemo(() => {
    return dataTypes.filter(dt => dt.source_type === 'system');
  }, [dataTypes]);

  // Get custom data types
  const customDataTypes = useMemo(() => {
    return dataTypes.filter(dt => dt.source_type === 'custom');
  }, [dataTypes]);

  // Get data type by name
  const getDataType = useCallback((name: string) => {
    return dataTypes.find(dt => dt.name === name);
  }, [dataTypes]);

  // Create a new custom data type
  const createDataType = useCallback(async (config: {
    name: string;
    display_name: string;
    icon?: string;
    color?: string;
    type_mode?: DataTypeMode;
    source_table?: string | null;
    display_field?: string | null;
    options?: DataTypeSelectOption[];
    description?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('data_types')
        .insert({
          name: config.name,
          display_name: config.display_name,
          icon: config.icon,
          color: config.color,
          type_mode: config.type_mode || 'linked',
          source_table: config.source_table || null,
          display_field: config.display_field || null,
          options: config.options as unknown as Json,
          description: config.description,
          source_type: 'custom',
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'סוג נתון נוצר',
        description: `הסוג "${config.display_name}" נוצר בהצלחה`,
      });

      await fetchDataTypes();
      return data;
    } catch (error: any) {
      console.error('Error creating data type:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן ליצור את סוג הנתון',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, fetchDataTypes]);

  // Update a custom data type
  const updateDataType = useCallback(async (id: string, updates: Partial<DataTypeConfig>) => {
    try {
      // Transform updates for database compatibility
      const dbUpdates: Record<string, any> = {};
      if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.type_mode !== undefined) dbUpdates.type_mode = updates.type_mode;
      if (updates.source_table !== undefined) dbUpdates.source_table = updates.source_table;
      if (updates.display_field !== undefined) dbUpdates.display_field = updates.display_field;
      if (updates.options !== undefined) dbUpdates.options = updates.options as unknown as Json;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      
      const { error } = await supabase
        .from('data_types')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'סוג נתון עודכן',
        description: 'השינויים נשמרו בהצלחה',
      });

      await fetchDataTypes();
      return true;
    } catch (error: any) {
      console.error('Error updating data type:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן לעדכן את סוג הנתון',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchDataTypes]);

  // Delete a custom data type
  const deleteDataType = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('data_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'סוג נתון נמחק',
        description: 'הסוג הוסר בהצלחה',
      });

      await fetchDataTypes();
      return true;
    } catch (error: any) {
      console.error('Error deleting data type:', error);
      toast({
        title: 'שגיאה',
        description: error.message || 'לא ניתן למחוק את סוג הנתון',
        variant: 'destructive',
      });
      return false;
    }
  }, [fetchDataTypes]);

  return {
    dataTypes,
    systemDataTypes,
    customDataTypes,
    isLoading,
    canManage,
    getDataType,
    createDataType,
    updateDataType,
    deleteDataType,
    refetch: fetchDataTypes,
  };
}

// Hook to fetch options for a specific data type (for dropdowns)
export function useDataTypeOptions(dataTypeName: string | undefined) {
  const [options, setOptions] = useState<DataTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { dataTypes } = useDataTypes();

  const fetchOptions = useCallback(async () => {
    if (!dataTypeName) {
      setOptions([]);
      return;
    }

    const dataType = dataTypes.find(dt => dt.name === dataTypeName);
    if (!dataType) {
      setOptions([]);
      return;
    }

    setIsLoading(true);
    try {
      // OPTIONS MODE: Return static options directly
      if (dataType.type_mode === 'options' && dataType.options && dataType.options.length > 0) {
        const formattedOptions: DataTypeOption[] = dataType.options.map((opt) => ({
          value: opt.value,
          label: opt.label,
          color: opt.color || dataType.color,
          icon: opt.icon || dataType.icon,
        }));
        setOptions(formattedOptions);
        setIsLoading(false);
        return;
      }

      // LINKED MODE: Fetch from source table
      if (dataType.type_mode === 'linked' && dataType.source_table && dataType.display_field) {
        const { data, error } = await supabase
          .from(dataType.source_table as any)
          .select(`id, ${dataType.display_field}`)
          .order(dataType.display_field);

        if (error) throw error;

        const formattedOptions: DataTypeOption[] = (data || []).map((item: any) => ({
          value: item.id,
          label: item[dataType.display_field!] || 'ללא שם',
          color: dataType.color,
          icon: dataType.icon,
        }));

        setOptions(formattedOptions);
      } else {
        setOptions([]);
      }
    } catch (error) {
      console.error('Error fetching data type options:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [dataTypeName, dataTypes]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return { options, isLoading, refetch: fetchOptions, dataType: dataTypes.find(dt => dt.name === dataTypeName) };
}

// Hook to get all linked data for an entity
export function useLinkedData(entityType: string, entityId: string | undefined) {
  const [linkedData, setLinkedData] = useState<Record<string, any[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchLinkedData = useCallback(async () => {
    if (!entityId || !entityType) {
      setLinkedData({});
      return;
    }

    setIsLoading(true);
    try {
      const results: Record<string, any[]> = {};

      // Determine which column to use based on entity type
      const columnMap: Record<string, string> = {
        client: 'client_id',
        employee: 'user_id',
        project: 'project_id',
      };

      const column = columnMap[entityType];
      if (!column) {
        setLinkedData({});
        return;
      }

      // Fetch from various tables in parallel
      const tables = entityType === 'client' 
        ? ['time_entries', 'projects', 'invoices', 'tasks', 'meetings', 'reminders']
        : entityType === 'employee'
        ? ['time_entries', 'tasks']
        : ['time_entries', 'tasks', 'invoices'];

      const promises = tables.map(async (table) => {
        try {
          const { data, error } = await supabase
            .from(table as any)
            .select('*')
            .eq(column, entityId)
            .limit(100);

          if (!error && data) {
            results[table] = data;
          }
        } catch (e) {
          console.error(`Error fetching ${table}:`, e);
        }
      });

      // Also fetch from custom_table_data if it's a client
      if (entityType === 'client') {
        promises.push(
          (async () => {
            try {
              const { data, error } = await supabase
                .from('custom_table_data')
                .select('*, custom_tables(display_name)')
                .eq('linked_client_id', entityId)
                .limit(100);

              if (!error && data) {
                results['custom_table_data'] = data;
              }
            } catch (e) {
              console.error('Error fetching custom_table_data:', e);
            }
          })()
        );
      }

      await Promise.all(promises);
      setLinkedData(results);
    } catch (error) {
      console.error('Error fetching linked data:', error);
      setLinkedData({});
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    fetchLinkedData();
  }, [fetchLinkedData]);

  return { linkedData, isLoading, refetch: fetchLinkedData };
}

// Hook to fetch custom tables (for data type manager)
export function useCustomTables() {
  const [customTables, setCustomTables] = useState<Array<{
    id: string;
    name: string;
    display_name: string;
    columns: any;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomTables = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('custom_tables')
        .select('id, name, display_name, columns')
        .order('display_name');

      if (error) throw error;
      setCustomTables(data || []);
    } catch (error) {
      console.error('Error fetching custom tables:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomTables();
  }, [fetchCustomTables]);

  return { customTables, isLoading, refetch: fetchCustomTables };
}
