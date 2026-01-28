// DataTypeValueDialog - Dialog to show all linked data for a specific data type option value
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Database, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDataTypeLinkedData } from '@/hooks/useDataTypeLinkedData';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface DataTypeValueDialogProps {
  dataTypeName: string;
  optionValue: string;
  optionLabel: string;
  optionColor?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DataTypeValueDialog({
  dataTypeName,
  optionValue,
  optionLabel,
  optionColor = '#1e3a5f',
  isOpen,
  onClose,
}: DataTypeValueDialogProps) {
  const navigate = useNavigate();
  const { linkedData, isLoading } = useDataTypeLinkedData(dataTypeName, optionValue);
  
  const totalRecords = linkedData.reduce((sum, table) => sum + table.count, 0);

  // Get display columns for a record
  const getDisplayColumns = (record: any, tableName: string): { key: string; label: string; value: string }[] => {
    const columns: { key: string; label: string; value: string }[] = [];
    
    // Common columns to display
    const priorityKeys = ['name', 'full_name', 'title', 'description', 'email', 'company', 'status'];
    
    for (const key of priorityKeys) {
      if (record[key]) {
        columns.push({
          key,
          label: key,
          value: String(record[key]),
        });
      }
      if (columns.length >= 3) break;
    }
    
    // Add created_at if available
    if (record.created_at) {
      try {
        columns.push({
          key: 'created_at',
          label: 'נוצר',
          value: format(new Date(record.created_at), 'dd/MM/yyyy', { locale: he }),
        });
      } catch {
        // Ignore date formatting errors
      }
    }
    
    return columns;
  };

  // Navigate to record
  const handleRecordClick = (record: any, tableName: string) => {
    if (tableName === 'לקוחות' || tableName === 'clients') {
      navigate(`/client-profile/${record.id}`);
      onClose();
    } else if (tableName === 'פרויקטים' || tableName === 'projects') {
      navigate(`/projects?project=${record.id}`);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] border-2 border-[hsl(222,47%,25%)]/30 bg-gradient-to-br from-white to-[hsl(222,47%,98%)]" dir="rtl">
        <DialogHeader className="border-b border-[hsl(222,47%,25%)]/20 pb-4">
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <DialogTitle className="text-xl font-bold text-[hsl(222,47%,25%)] flex items-center gap-3 justify-end">
                <Badge 
                  className="text-base px-3 py-1"
                  style={{ backgroundColor: optionColor, color: 'white' }}
                >
                  {optionLabel}
                </Badge>
                <span>מידע מקושר ל:</span>
              </DialogTitle>
              <DialogDescription className="text-right text-[hsl(222,47%,25%)]/60 mt-2">
                כל הרשומות מכל הטבלאות שבהן נבחר "{optionLabel}"
                {!isLoading && ` (${totalRecords} רשומות)`}
              </DialogDescription>
            </div>
            <div 
              className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${optionColor}, ${optionColor}dd)` }}
            >
              <Database className="h-6 w-6" />
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(222,47%,25%)]" />
              <span className="text-[hsl(222,47%,25%)]/60">טוען נתונים מקושרים...</span>
            </div>
          ) : linkedData.length === 0 ? (
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-[hsl(222,47%,25%)]/30 mb-3" />
              <p className="text-[hsl(222,47%,25%)]/60">
                לא נמצאו רשומות עם הערך "{optionLabel}"
              </p>
              <p className="text-sm text-[hsl(222,47%,25%)]/40 mt-1">
                הוסף עמודות מסוג זה לטבלאות ובחר את הערך הזה כדי לראות קישורים
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {linkedData.map((table) => (
                <div 
                  key={table.tableName} 
                  className="border-2 border-[hsl(222,47%,25%)]/20 rounded-xl overflow-hidden shadow-sm"
                >
                  <div 
                    className="p-3 flex justify-between items-center"
                    style={{ background: `linear-gradient(135deg, ${optionColor}15, ${optionColor}08)` }}
                  >
                    <Badge 
                      variant="secondary"
                      className="bg-white/80"
                    >
                      {table.count} רשומות
                    </Badge>
                    <h3 className="font-semibold text-[hsl(222,47%,25%)] flex items-center gap-2">
                      <Database className="h-4 w-4" style={{ color: optionColor }} />
                      {table.displayName}
                    </h3>
                  </div>
                  
                  <div className="bg-white">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-10 text-center">#</TableHead>
                          <TableHead className="text-right">פרטים</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {table.records.slice(0, 10).map((record, idx) => {
                          const displayCols = getDisplayColumns(record, table.tableName);
                          return (
                            <TableRow 
                              key={record.id || idx}
                              className="cursor-pointer hover:bg-[hsl(222,47%,25%)]/5"
                              onClick={() => handleRecordClick(record, table.tableName)}
                            >
                              <TableCell className="text-center text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-wrap gap-2 justify-end">
                                  {displayCols.map(col => (
                                    <span key={col.key} className="text-sm">
                                      <span className="text-muted-foreground">{col.label}: </span>
                                      <span className="font-medium">{col.value}</span>
                                    </span>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {table.records.length > 10 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-2">
                              ... ועוד {table.records.length - 10} רשומות
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
