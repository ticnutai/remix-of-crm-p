// useDataTypeLinkedData - Hook to fetch all linked data for a specific data type option value
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useDataTypes } from '@/hooks/useDataTypes';

export interface LinkedDataResult {
  tableName: string;
  displayName: string;
  records: any[];
  count: number;
}

// Helper to group items by a key
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

// Get display name for system tables
function getTableDisplayName(tableName: string): string {
  const displayNames: Record<string, string> = {
    clients: 'לקוחות',
    profiles: 'עובדים',
    projects: 'פרויקטים',
    time_entries: 'רישומי זמן',
    tasks: 'משימות',
    meetings: 'פגישות',
    invoices: 'חשבוניות',
  };
  return displayNames[tableName] || tableName;
}

export function useDataTypeLinkedData(
  dataTypeName: string | undefined,
  optionValue: string | undefined
) {
  const [linkedData, setLinkedData] = useState<LinkedDataResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { dataTypes } = useDataTypes();

  const fetchLinkedData = useCallback(async () => {
    if (!dataTypeName || !optionValue) {
      setLinkedData([]);
      return;
    }

    setIsLoading(true);
    const results: LinkedDataResult[] = [];

    try {
      // Check if this is a client stage data type
      if (dataTypeName.startsWith('client_stage_')) {
        const stageId = dataTypeName.replace('client_stage_', '');
        const isCompleted = optionValue === 'completed';
        
        // Fetch clients with this stage status
        const { data: stageData, error: stageError } = await supabase
          .from('client_stages')
          .select(`
            client_id,
            stage_name,
            is_completed,
            clients!inner(id, name, company, email, phone, status)
          `)
          .eq('stage_id', stageId)
          .eq('is_completed', isCompleted);

        if (!stageError && stageData && stageData.length > 0) {
          const clients = stageData.map((item: any) => item.clients);
          results.push({
            tableName: 'clients',
            displayName: 'לקוחות',
            records: clients,
            count: clients.length,
          });
        }

        setLinkedData(results);
        setIsLoading(false);
        return;
      }

      const dataType = dataTypes.find(dt => dt.name === dataTypeName);
      if (!dataType || dataType.type_mode !== 'options') {
        setLinkedData([]);
        setIsLoading(false);
        return;
      }

      // 1. Find all columns that use this data type
      const { data: columns, error: columnsError } = await supabase
        .from('table_custom_columns')
        .select('*, data_types!inner(name)')
        .eq('data_types.name', dataTypeName);

      if (columnsError || !columns || columns.length === 0) {
        setLinkedData([]);
        setIsLoading(false);
        return;
      }

      // 2. Group by table
      const tableColumns = groupBy(columns, 'table_name');

      // 3. For each table - find records with this value
      for (const [tableName, cols] of Object.entries(tableColumns)) {
        const columnKeys = cols.map(c => c.column_key);
        
        // System tables (clients, profiles, projects)
        if (['clients', 'profiles', 'projects'].includes(tableName)) {
          const { data, error } = await supabase
            .from(tableName as any)
            .select('*');
          
          if (!error && data) {
            // Filter records that have this value in custom_data
            const matches = data.filter((row: any) => 
              columnKeys.some(key => row.custom_data?.[key] === optionValue)
            );
            
            if (matches.length > 0) {
              results.push({
                tableName,
                displayName: getTableDisplayName(tableName),
                records: matches,
                count: matches.length,
              });
            }
          }
        }
        // Custom tables (custom_table_data)
        else {
          const { data: customTable } = await supabase
            .from('custom_tables')
            .select('id, display_name')
            .eq('name', tableName)
            .single();
          
          if (customTable) {
            const { data, error } = await supabase
              .from('custom_table_data')
              .select('*')
              .eq('table_id', customTable.id);
            
            if (!error && data) {
              const matches = data.filter((row: any) => 
                columnKeys.some(key => row.data?.[key] === optionValue)
              );
              
              if (matches.length > 0) {
                results.push({
                  tableName: customTable.display_name,
                  displayName: customTable.display_name,
                  records: matches,
                  count: matches.length,
                });
              }
            }
          }
        }
      }

      setLinkedData(results);
    } catch (error) {
      console.error('Error fetching linked data for data type:', error);
      setLinkedData([]);
    } finally {
      setIsLoading(false);
    }
  }, [dataTypeName, optionValue, dataTypes]);

  useEffect(() => {
    fetchLinkedData();
  }, [fetchLinkedData]);

  return { linkedData, isLoading, refetch: fetchLinkedData };
}
