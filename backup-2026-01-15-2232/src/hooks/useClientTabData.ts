// Hook for managing client tab data (custom table within a client tab)
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { FieldMetadata } from '@/hooks/useFieldMetadata';

export interface ClientTabDataRow {
  id: string;
  tab_id: string;
  client_id: string;
  data: Record<string, any>;
  field_metadata?: FieldMetadata;
  notes: string | null;
  summary: string | null;
  analysis: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  files?: ClientTabFile[];
}

export interface ClientTabFile {
  id: string;
  tab_data_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  created_by: string;
  created_at: string;
}

export interface TabColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'file' | 'textarea';
  options?: string[]; // for select type
  required?: boolean;
  width?: number;
}

export function useClientTabData(tabId: string, clientId: string) {
  const { user, isAdmin, isManager } = useAuth();
  const [rows, setRows] = useState<ClientTabDataRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<string>('');
  const [analysis, setAnalysis] = useState<string>('');

  const canEdit = isAdmin || isManager;

  // Fetch all rows for this tab and client
  const fetchRows = useCallback(async () => {
    if (!tabId || !clientId) {
      setRows([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_tab_data')
        .select(`
          *,
          files:client_tab_files(*)
        `)
        .eq('tab_id', tabId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse field_metadata from jsonb
      const parsedData = (data || []).map(row => ({
        ...row,
        field_metadata: (row.field_metadata as unknown as FieldMetadata) || {},
      }));
      
      setRows(parsedData as ClientTabDataRow[]);
    } catch (error) {
      console.error('Error fetching tab data:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את הנתונים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [tabId, clientId]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  // Add a new row
  const addRow = useCallback(async (data: Record<string, any>, notes?: string) => {
    if (!user || !canEdit || !tabId || !clientId) return null;

    try {
      // Generate field metadata for all fields in data
      const now = new Date().toISOString();
      const fieldMetadata: FieldMetadata = {};
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null && data[key] !== '') {
          fieldMetadata[key] = {
            created_at: now,
            updated_at: now,
            created_by: user.id,
            updated_by: user.id,
          };
        }
      });

      const insertData = {
        tab_id: tabId,
        client_id: clientId,
        data: data as any,
        field_metadata: fieldMetadata as any,
        notes,
        created_by: user.id,
      };

      const { data: newRow, error } = await supabase
        .from('client_tab_data')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'נוסף בהצלחה',
        description: 'הרשומה החדשה נוספה',
      });

      await fetchRows();
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
  }, [user, canEdit, tabId, clientId, fetchRows]);

  // Update a row
  const updateRow = useCallback(async (
    rowId: string, 
    updates: Partial<Pick<ClientTabDataRow, 'data' | 'notes' | 'summary' | 'analysis'>>,
    existingFieldMetadata?: FieldMetadata
  ) => {
    if (!user || !canEdit) return false;

    try {
      // If data is being updated, update field metadata
      let fieldMetadataUpdate: FieldMetadata | undefined;
      if (updates.data && existingFieldMetadata) {
        const now = new Date().toISOString();
        fieldMetadataUpdate = { ...existingFieldMetadata };
        
        Object.keys(updates.data).forEach(key => {
          if (existingFieldMetadata[key]) {
            // Update existing field
            fieldMetadataUpdate![key] = {
              ...existingFieldMetadata[key],
              updated_at: now,
              updated_by: user.id,
            };
          } else {
            // New field
            fieldMetadataUpdate![key] = {
              created_at: now,
              updated_at: now,
              created_by: user.id,
              updated_by: user.id,
            };
          }
        });
      }

      const updatePayload: any = { ...updates };
      if (fieldMetadataUpdate) {
        updatePayload.field_metadata = fieldMetadataUpdate;
      }

      const { error } = await supabase
        .from('client_tab_data')
        .update(updatePayload)
        .eq('id', rowId);

      if (error) throw error;

      toast({
        title: 'עודכן בהצלחה',
      });

      await fetchRows();
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
  }, [user, canEdit, fetchRows]);

  // Delete a row
  const deleteRow = useCallback(async (rowId: string) => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('client_tab_data')
        .delete()
        .eq('id', rowId);

      if (error) throw error;

      toast({
        title: 'נמחק בהצלחה',
      });

      await fetchRows();
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
  }, [user, isAdmin, fetchRows]);

  // Add file to a row
  const addFile = useCallback(async (rowId: string, file: File) => {
    if (!user || !canEdit) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `tab-files/${tabId}/${rowId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-files')
        .getPublicUrl(fileName);

      // Insert file record
      const { data: newFile, error: insertError } = await supabase
        .from('client_tab_files')
        .insert({
          tab_data_id: rowId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          file_type: file.type || fileExt,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast({
        title: 'הקובץ הועלה בהצלחה',
      });

      await fetchRows();
      return newFile;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        title: 'שגיאה בהעלאת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  }, [user, canEdit, tabId, fetchRows]);

  // Delete a file
  const deleteFile = useCallback(async (fileId: string) => {
    if (!user || !isAdmin) return false;

    try {
      const { error } = await supabase
        .from('client_tab_files')
        .delete()
        .eq('id', fileId);

      if (error) throw error;

      toast({
        title: 'הקובץ נמחק',
      });

      await fetchRows();
      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error);
      toast({
        title: 'שגיאה במחיקת הקובץ',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }
  }, [user, isAdmin, fetchRows]);

  // Generate summary
  const generateSummary = useCallback(async () => {
    if (rows.length === 0) {
      setSummary('אין נתונים לסיכום');
      return;
    }

    const totalRows = rows.length;
    const newestDate = rows.length > 0 ? new Date(rows[0].created_at).toLocaleDateString('he-IL') : '-';
    const oldestDate = rows.length > 0 ? new Date(rows[rows.length - 1].created_at).toLocaleDateString('he-IL') : '-';
    const withNotes = rows.filter(r => r.notes).length;
    const totalFiles = rows.reduce((sum, r) => sum + (r.files?.length || 0), 0);

    setSummary(`
סה"כ רשומות: ${totalRows}
רשומות עם הערות: ${withNotes}
קבצים מצורפים: ${totalFiles}
טווח תאריכים: ${oldestDate} - ${newestDate}
    `.trim());
  }, [rows]);

  // Generate analysis
  const generateAnalysis = useCallback(async () => {
    if (rows.length === 0) {
      setAnalysis('אין נתונים לניתוח');
      return;
    }

    // Analyze data columns
    const allKeys = new Set<string>();
    rows.forEach(row => {
      Object.keys(row.data || {}).forEach(key => allKeys.add(key));
    });

    const columnStats: string[] = [];
    allKeys.forEach(key => {
      const values = rows.map(r => r.data[key]).filter(v => v !== undefined && v !== null && v !== '');
      const filled = values.length;
      const percentage = Math.round((filled / rows.length) * 100);
      columnStats.push(`${key}: ${filled}/${rows.length} (${percentage}%)`);
    });

    setAnalysis(`
ניתוח נתונים:
${columnStats.length > 0 ? columnStats.join('\n') : 'אין עמודות נתונים'}

מגמות:
- ${rows.length > 5 ? 'יש מספיק נתונים לניתוח מגמות' : 'מעט נתונים לניתוח מגמות מלא'}
- רשומות עם הערות: ${rows.filter(r => r.notes).length}
    `.trim());
  }, [rows]);

  return {
    rows,
    isLoading,
    canEdit,
    addRow,
    updateRow,
    deleteRow,
    addFile,
    deleteFile,
    refetch: fetchRows,
    summary,
    analysis,
    generateSummary,
    generateAnalysis,
  };
}
