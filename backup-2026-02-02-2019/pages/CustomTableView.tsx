import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  ArrowRight,
  Table as TableIcon,
  Settings,
  Shield,
} from 'lucide-react';
import { ManagePermissionsDialog } from '@/components/custom-tables/ManagePermissionsDialog';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCustomTables, useCustomTableData, CustomTable, TableColumn } from '@/hooks/useCustomTables';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function CustomTableView() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { tables, isLoading: tablesLoading, canManage } = useCustomTables();
  const { data, isLoading: dataLoading, addRow, updateRow, deleteRow, fetchData } = useCustomTableData(tableId || null);
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const table = useMemo(() => 
    tables.find(t => t.id === tableId),
    [tables, tableId]
  );

  useEffect(() => {
    if (table) {
      // Initialize form with default values
      const defaults: Record<string, any> = {};
      table.columns.forEach(col => {
        if (col.type === 'boolean') defaults[col.name] = false;
        else if (col.type === 'number') defaults[col.name] = 0;
        else defaults[col.name] = '';
      });
      setFormData(defaults);
    }
  }, [table]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(row => {
      const values = Object.values(row.data || {});
      return values.some(v => 
        String(v).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm]);

  const handleOpenAddDialog = () => {
    if (table) {
      const defaults: Record<string, any> = {};
      table.columns.forEach(col => {
        if (col.type === 'boolean') defaults[col.name] = false;
        else if (col.type === 'number') defaults[col.name] = 0;
        else defaults[col.name] = '';
      });
      setFormData(defaults);
    }
    setEditingRow(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEditDialog = (row: any) => {
    setFormData(row.data || {});
    setEditingRow(row);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingRow) {
      await updateRow(editingRow.id, formData);
    } else {
      await addRow(formData);
    }
    setIsAddDialogOpen(false);
    setEditingRow(null);
  };

  const handleDelete = async (rowId: string) => {
    await deleteRow(rowId);
  };

  const handleExport = () => {
    if (!table || data.length === 0) return;

    const headers = table.columns.map(col => col.displayName);
    const rows = data.map(row => 
      table.columns.map(col => {
        const value = row.data[col.name];
        if (col.type === 'boolean') return value ? 'כן' : 'לא';
        if (col.type === 'date' && value) return format(new Date(value), 'dd/MM/yyyy');
        return value || '';
      })
    );

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${table.display_name}.csv`;
    link.click();
  };

  const renderFormField = (column: TableColumn) => {
    const value = formData[column.name];

    switch (column.type) {
      case 'boolean':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              id={column.name}
              checked={value || false}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [column.name]: checked }))}
            />
            <Label htmlFor={column.name}>{column.displayName}</Label>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [column.name]: Number(e.target.value) }))}
            placeholder={column.displayName}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [column.name]: e.target.value }))}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={(v) => setFormData(prev => ({ ...prev, [column.name]: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={`בחר ${column.displayName}`} />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, [column.name]: e.target.value }))}
            placeholder={column.displayName}
          />
        );
    }
  };

  const renderCellValue = (column: TableColumn, value: any) => {
    if (value === null || value === undefined) return '-';

    switch (column.type) {
      case 'boolean':
        return value ? (
          <Badge className="bg-green-500/20 text-green-600">כן</Badge>
        ) : (
          <Badge variant="outline">לא</Badge>
        );

      case 'date':
        try {
          return format(new Date(value), 'dd/MM/yyyy', { locale: he });
        } catch {
          return value;
        }

      case 'number':
        return value.toLocaleString('he-IL');

      default:
        return String(value);
    }
  };

  if (tablesLoading) {
    return (
      <AppLayout title="טוען...">
        <div className="p-8 text-center">
          <TableIcon className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">טוען נתונים...</p>
        </div>
      </AppLayout>
    );
  }

  if (!table) {
    return (
      <AppLayout title="טבלה לא נמצאה">
        <div className="p-8 text-center">
          <TableIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">הטבלה לא נמצאה</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזור
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={table.display_name}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{table.display_name}</h1>
              {table.description && (
                <p className="text-muted-foreground text-sm">{table.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 w-[200px]"
              />
            </div>

            <Button variant="outline" onClick={handleExport} disabled={data.length === 0}>
              <Download className="h-4 w-4 ml-2" />
              ייצוא
            </Button>

            {canManage && (
              <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(true)}>
                <Shield className="h-4 w-4 ml-2" />
                הרשאות
              </Button>
            )}

            <Button onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 ml-2" />
              הוסף רשומה
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <TableIcon className="h-5 w-5 text-secondary" />
                רשומות
              </div>
              <Badge variant="secondary">{filteredData.length} רשומות</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dataLoading ? (
              <div className="p-8 text-center">
                <TableIcon className="h-12 w-12 mx-auto mb-4 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">טוען נתונים...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center">
                <TableIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg text-muted-foreground">אין רשומות</p>
                <p className="text-sm text-muted-foreground">הוסף רשומה ראשונה</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] text-right">פעולות</TableHead>
                      {table.columns.map(col => (
                        <TableHead key={col.id} className="text-right">
                          {col.displayName}
                          {col.required && <span className="text-destructive mr-1">*</span>}
                        </TableHead>
                      ))}
                      <TableHead className="w-[120px] text-right">נוצר</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map(row => (
                      <TableRow key={row.id}>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>מחיקת רשומה</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    האם למחוק את הרשומה? פעולה זו לא ניתנת לביטול.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(row.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    מחק
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(row)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        {table.columns.map(col => (
                          <TableCell key={col.id} className="text-right">
                            {renderCellValue(col, row.data[col.name])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {format(parseISO(row.created_at), 'dd/MM/yy HH:mm', { locale: he })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingRow ? 'עריכת רשומה' : 'הוספת רשומה'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {table.columns.map(column => (
              <div key={column.id} className="space-y-2">
                {column.type !== 'boolean' && (
                  <Label>
                    {column.displayName}
                    {column.required && <span className="text-destructive mr-1">*</span>}
                  </Label>
                )}
                {renderFormField(column)}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              ביטול
            </Button>
            <Button onClick={handleSubmit}>
              {editingRow ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      {table && (
        <ManagePermissionsDialog
          open={isPermissionsDialogOpen}
          onOpenChange={setIsPermissionsDialogOpen}
          tableId={table.id}
          tableName={table.display_name}
        />
      )}
    </AppLayout>
  );
}
