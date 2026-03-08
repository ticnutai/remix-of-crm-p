import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  Trash2,
  Users,
  Briefcase,
  FileText,
  Clock,
  Calendar,
  Bell,
  DollarSign,
  MessageSquare,
  FolderOpen,
  Table,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface DataCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  tableName: string;
  color: string;
  count?: number;
}

interface DuplicateGroup {
  key: string;
  field: string;
  value: string;
  items: any[];
}

interface DuplicateScanResult {
  tableName: string;
  tableLabel: string;
  groups: DuplicateGroup[];
  totalDuplicates: number;
}

export function DataCleanupTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  
  // Duplicate detection state
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [duplicateResults, setDuplicateResults] = useState<DuplicateScanResult[]>([]);
  const [showDuplicatesDialog, setShowDuplicatesDialog] = useState(false);
  const [selectedDuplicates, setSelectedDuplicates] = useState<Set<string>>(new Set());
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);

  const categories: DataCategory[] = [
    {
      id: 'clients',
      name: 'לקוחות',
      description: 'מחק את כל הלקוחות מהמערכת',
      icon: <Users className="h-5 w-5" />,
      tableName: 'clients',
      color: 'text-blue-500',
    },
    {
      id: 'projects',
      name: 'פרויקטים',
      description: 'מחק את כל הפרויקטים',
      icon: <Briefcase className="h-5 w-5" />,
      tableName: 'projects',
      color: 'text-purple-500',
    },
    {
      id: 'tasks',
      name: 'משימות',
      description: 'מחק את כל המשימות',
      icon: <FileText className="h-5 w-5" />,
      tableName: 'tasks',
      color: 'text-green-500',
    },
    {
      id: 'time_entries',
      name: 'רישומי זמן',
      description: 'מחק את כל רישומי הזמן והשעות',
      icon: <Clock className="h-5 w-5" />,
      tableName: 'time_entries',
      color: 'text-orange-500',
    },
    {
      id: 'meetings',
      name: 'פגישות',
      description: 'מחק את כל הפגישות מלוח השנה',
      icon: <Calendar className="h-5 w-5" />,
      tableName: 'meetings',
      color: 'text-cyan-500',
    },
    {
      id: 'reminders',
      name: 'תזכורות',
      description: 'מחק את כל התזכורות',
      icon: <Bell className="h-5 w-5" />,
      tableName: 'reminders',
      color: 'text-yellow-500',
    },
    {
      id: 'invoices',
      name: 'חשבוניות',
      description: 'מחק את כל החשבוניות',
      icon: <DollarSign className="h-5 w-5" />,
      tableName: 'invoices',
      color: 'text-emerald-500',
    },
    {
      id: 'quotes',
      name: 'הצעות מחיר',
      description: 'מחק את כל הצעות המחיר',
      icon: <FileText className="h-5 w-5" />,
      tableName: 'quotes',
      color: 'text-indigo-500',
    },
    {
      id: 'expenses',
      name: 'הוצאות',
      description: 'מחק את כל ההוצאות',
      icon: <DollarSign className="h-5 w-5" />,
      tableName: 'expenses',
      color: 'text-red-500',
    },
    {
      id: 'client_messages',
      name: 'הודעות',
      description: 'מחק את כל ההודעות ללקוחות',
      icon: <MessageSquare className="h-5 w-5" />,
      tableName: 'client_messages',
      color: 'text-pink-500',
    },
    {
      id: 'client_files',
      name: 'קבצים',
      description: 'מחק את כל הקבצים המשותפים',
      icon: <FolderOpen className="h-5 w-5" />,
      tableName: 'client_files',
      color: 'text-amber-500',
    },
    {
      id: 'custom_table_data',
      name: 'טבלאות מותאמות',
      description: 'מחק את כל הנתונים בטבלאות המותאמות',
      icon: <Table className="h-5 w-5" />,
      tableName: 'custom_table_data',
      color: 'text-violet-500',
    },
  ];

  const fetchCounts = async () => {
    setIsLoadingCounts(true);
    try {
      const newCounts: Record<string, number> = {};
      
      await Promise.all(
        categories.map(async (cat) => {
          const { count, error } = await supabase
            .from(cat.tableName as any)
            .select('*', { count: 'exact', head: true });
          
          if (!error && count !== null) {
            newCounts[cat.id] = count;
          }
        })
      );
      
      setCounts(newCounts);
    } catch (error) {
      console.error('Error fetching counts:', error);
    } finally {
      setIsLoadingCounts(false);
    }
  };

  React.useEffect(() => {
    fetchCounts();
  }, []);

  // Scan for duplicates
  const scanForDuplicates = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setDuplicateResults([]);
    
    const tablesToScan = [
      { name: 'clients', label: 'לקוחות', fields: ['name', 'email', 'phone', 'id_number'] },
      { name: 'projects', label: 'פרויקטים', fields: ['name'] },
      { name: 'tasks', label: 'משימות', fields: ['title'] },
    ];
    
    const results: DuplicateScanResult[] = [];
    
    try {
      for (let i = 0; i < tablesToScan.length; i++) {
        const table = tablesToScan[i];
        setScanProgress(Math.round(((i + 0.5) / tablesToScan.length) * 100));
        
        // Fetch all records from the table
        const { data, error } = await supabase
          .from(table.name as any)
          .select('*');
        
        if (error || !data) continue;
        
        const groups: DuplicateGroup[] = [];
        
        // Check each field for duplicates
        for (const field of table.fields) {
          const valueMap = new Map<string, any[]>();
          
          for (const item of data) {
            const value = item[field];
            if (!value || value === '') continue;
            
            const normalizedValue = String(value).trim().toLowerCase();
            if (!valueMap.has(normalizedValue)) {
              valueMap.set(normalizedValue, []);
            }
            valueMap.get(normalizedValue)!.push(item);
          }
          
          // Find groups with more than one item (duplicates)
          for (const [value, items] of valueMap) {
            if (items.length > 1) {
              groups.push({
                key: `${table.name}-${field}-${value}`,
                field,
                value: items[0][field], // Original value (not normalized)
                items,
              });
            }
          }
        }
        
        if (groups.length > 0) {
          const totalDuplicates = groups.reduce((sum, g) => sum + g.items.length - 1, 0);
          results.push({
            tableName: table.name,
            tableLabel: table.label,
            groups,
            totalDuplicates,
          });
        }
        
        setScanProgress(Math.round(((i + 1) / tablesToScan.length) * 100));
      }
      
      setDuplicateResults(results);
      setShowDuplicatesDialog(true);
      
      const totalDuplicates = results.reduce((sum, r) => sum + r.totalDuplicates, 0);
      
      if (totalDuplicates === 0) {
        toast({
          title: 'לא נמצאו כפילויות',
          description: 'המערכת נקייה מכפילויות',
        });
      } else {
        toast({
          title: 'נמצאו כפילויות',
          description: `נמצאו ${totalDuplicates} רשומות כפולות`,
        });
      }
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
      toast({
        title: 'שגיאה בסריקה',
        description: 'לא ניתן לסרוק את הנתונים',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  // Toggle duplicate selection
  const toggleDuplicateSelection = (itemId: string) => {
    setSelectedDuplicates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Select all duplicates (keep first, select rest)
  const selectAllDuplicates = () => {
    const allDuplicateIds = new Set<string>();
    for (const result of duplicateResults) {
      for (const group of result.groups) {
        // Skip the first item (keep it), select the rest
        for (let i = 1; i < group.items.length; i++) {
          allDuplicateIds.add(`${result.tableName}:${group.items[i].id}`);
        }
      }
    }
    setSelectedDuplicates(allDuplicateIds);
  };

  // Clear selection
  const clearDuplicateSelection = () => {
    setSelectedDuplicates(new Set());
  };

  // Delete selected duplicates
  const deleteSelectedDuplicates = async () => {
    if (selectedDuplicates.size === 0) return;
    
    setIsDeletingDuplicates(true);
    
    try {
      // Group by table
      const byTable = new Map<string, string[]>();
      for (const key of selectedDuplicates) {
        const [table, id] = key.split(':');
        if (!byTable.has(table)) {
          byTable.set(table, []);
        }
        byTable.get(table)!.push(id);
      }
      
      // Delete from each table
      for (const [table, ids] of byTable) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .in('id', ids);
        
        if (error) {
          console.error(`Error deleting from ${table}:`, error);
        }
      }
      
      toast({
        title: 'הכפילויות נמחקו',
        description: `${selectedDuplicates.size} רשומות כפולות נמחקו בהצלחה`,
      });
      
      // Reset and rescan
      setSelectedDuplicates(new Set());
      setShowDuplicatesDialog(false);
      fetchCounts();
      
    } catch (error) {
      console.error('Error deleting duplicates:', error);
      toast({
        title: 'שגיאה במחיקה',
        description: 'לא ניתן למחוק את הכפילויות',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingDuplicates(false);
    }
  };

  const handleDelete = async (category: DataCategory) => {
    if (!user) return;
    
    setIsLoading(category.id);
    try {
      // Tables that have user_id column and RLS based on user_id
      const tablesWithUserId = new Set(['time_entries', 'tasks', 'reminders', 'meetings', 'expenses']);
      
      let error;
      if (tablesWithUserId.has(category.tableName)) {
        // For tables with user_id RLS, filter by user_id
        const result = await supabase
          .from(category.tableName as any)
          .delete()
          .eq('user_id', user.id);
        error = result.error;
      } else {
        // For other tables, use the standard approach
        const result = await supabase
          .from(category.tableName as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all records
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: 'הנתונים נמחקו',
        description: `כל הנתונים מ"${category.name}" נמחקו בהצלחה`,
      });

      // Refresh counts
      fetchCounts();
    } catch (error: any) {
      console.error('Error deleting data:', error);
      toast({
        title: 'שגיאה במחיקה',
        description: error.message || 'לא ניתן למחוק את הנתונים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleDeleteAll = async () => {
    if (!user) return;
    
    setIsLoading('all');
    try {
      // Tables that have user_id column and RLS based on user_id
      const tablesWithUserId = new Set(['time_entries', 'tasks', 'reminders', 'meetings', 'expenses']);
      
      // Delete from all tables in order (respect foreign keys)
      const deleteOrder = [
        'invoice_payments',
        'quote_payments',
        'financial_alerts',
        'client_messages',
        'client_files',
        'project_updates',
        'custom_table_data',
        'time_entries',
        'tasks',
        'reminders',
        'meetings',
        'invoices',
        'quotes',
        'expenses',
        'projects',
        'clients',
      ];

      for (const tableName of deleteOrder) {
        if (tablesWithUserId.has(tableName)) {
          // For tables with user_id RLS, filter by user_id
          await supabase
            .from(tableName as any)
            .delete()
            .eq('user_id', user.id);
        } else {
          // For other tables, use the standard approach
          await supabase
            .from(tableName as any)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      toast({
        title: 'כל הנתונים נמחקו',
        description: 'המערכת אופסה בהצלחה',
      });

      // Refresh counts
      fetchCounts();
    } catch (error: any) {
      console.error('Error deleting all data:', error);
      toast({
        title: 'שגיאה במחיקה',
        description: error.message || 'לא ניתן למחוק את כל הנתונים',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Duplicate Detection Card */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Copy className="h-5 w-5" />
                זיהוי כפילויות
              </CardTitle>
              <CardDescription>
                סרוק ומחק רשומות כפולות במערכת
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={scanForDuplicates}
              disabled={isScanning}
              className="border-amber-500/50 hover:bg-amber-500/10"
            >
              {isScanning ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Search className="h-4 w-4 ml-2" />
              )}
              סרוק כפילויות
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isScanning && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>סורק את המערכת...</span>
                <span>{scanProgress}%</span>
              </div>
              <Progress value={scanProgress} className="h-2" />
            </div>
          )}
          
          {!isScanning && duplicateResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  נמצאו {duplicateResults.reduce((sum, r) => sum + r.totalDuplicates, 0)} כפילויות ב-{duplicateResults.length} טבלאות
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDuplicatesDialog(true)}
                >
                  צפה בפרטים
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {duplicateResults.map(result => (
                  <Badge key={result.tableName} variant="outline" className="border-amber-500/50 text-amber-600">
                    {result.tableLabel}: {result.totalDuplicates} כפילויות
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {!isScanning && duplicateResults.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              לחץ על "סרוק כפילויות" כדי לחפש רשומות כפולות במערכת
            </p>
          )}
        </CardContent>
      </Card>

      {/* Duplicates Dialog */}
      <Dialog open={showDuplicatesDialog} onOpenChange={setShowDuplicatesDialog}>
        <DialogContent dir="rtl" className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Copy className="h-5 w-5 text-amber-600" />
              כפילויות שנמצאו
            </DialogTitle>
            <DialogDescription>
              בחר את הרשומות הכפולות שברצונך למחוק. מומלץ להשאיר את הרשומה הראשונה (המקורית) ולמחוק את השאר.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-between py-2 border-b flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={selectAllDuplicates}>
                <CheckCircle2 className="h-4 w-4 ml-2" />
                בחר את כל הכפילויות
              </Button>
              <Button variant="ghost" size="sm" onClick={clearDuplicateSelection}>
                <XCircle className="h-4 w-4 ml-2" />
                נקה בחירה
              </Button>
            </div>
            <Badge variant="secondary" className="flex-shrink-0">
              {selectedDuplicates.size} נבחרו למחיקה
            </Badge>
          </div>
          
          <div className="flex-1 overflow-hidden min-h-0">
            <ScrollArea className="h-full max-h-[55vh]">
              <div className="space-y-6 py-4 px-1">
              {duplicateResults.map(result => (
                <div key={result.tableName} className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {result.tableLabel}
                    <Badge variant="outline" className="mr-2">
                      {result.totalDuplicates} כפילויות
                    </Badge>
                  </h4>
                  
                  {result.groups.map(group => (
                    <Card key={group.key} className="border-amber-200 dark:border-amber-800">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                          <Badge variant="secondary">{group.field}</Badge>
                          <span>ערך: <strong>{group.value}</strong></span>
                          <span>({group.items.length} רשומות)</span>
                        </div>
                        
                        <div className="space-y-2">
                          {group.items.map((item, index) => {
                            const itemKey = `${result.tableName}:${item.id}`;
                            const isSelected = selectedDuplicates.has(itemKey);
                            const isFirst = index === 0;
                            
                            return (
                              <div
                                key={item.id}
                                className={`flex items-center gap-3 p-2 rounded-md border ${
                                  isFirst 
                                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                                    : isSelected 
                                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                                      : 'bg-muted/30 border-transparent'
                                }`}
                              >
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleDuplicateSelection(itemKey)}
                                  disabled={isFirst}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    {isFirst && (
                                      <Badge className="bg-green-500 text-white">מקורי</Badge>
                                    )}
                                    <span className="font-medium truncate">
                                      {item.name || item.title || item.id}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                                    {item.email && <span>📧 {item.email}</span>}
                                    {item.phone && <span>📱 {item.phone}</span>}
                                    {item.created_at && (
                                      <span>📅 {new Date(item.created_at).toLocaleDateString('he-IL')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
            </ScrollArea>
          </div>
          
          <DialogFooter className="border-t pt-4 flex-shrink-0">
            <Button variant="outline" onClick={() => setShowDuplicatesDialog(false)}>
              סגור
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelectedDuplicates}
              disabled={selectedDuplicates.size === 0 || isDeletingDuplicates}
            >
              {isDeletingDuplicates ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : (
                <Trash2 className="h-4 w-4 ml-2" />
              )}
              מחק {selectedDuplicates.size} נבחרים
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-destructive/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                ניקוי נתונים
              </CardTitle>
              <CardDescription>
                מחק נתונים לפי קטגוריה או אפס את כל המערכת
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCounts}
              disabled={isLoadingCounts}
            >
              {isLoadingCounts ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="mr-2">רענן</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-4 mb-6 bg-destructive/10 border border-destructive/30 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-destructive">אזהרה חשובה!</p>
                <p className="text-sm text-muted-foreground">
                  מחיקת נתונים היא פעולה בלתי הפיכה. לאחר המחיקה לא ניתן יהיה לשחזר את הנתונים.
                  מומלץ לגבות את הנתונים לפני ביצוע פעולה זו.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Card key={category.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-muted ${category.color}`}>
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-medium">{category.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {category.description}
                        </p>
                        {counts[category.id] !== undefined && (
                          <Badge variant="outline" className="mt-2">
                            {counts[category.id]} רשומות
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        disabled={isLoading === category.id || counts[category.id] === 0}
                      >
                        {isLoading === category.id ? (
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 ml-2" />
                        )}
                        מחק הכל
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                        <AlertDialogDescription>
                          פעולה זו תמחק את כל הנתונים מ"{category.name}".
                          <br />
                          לא ניתן לבטל פעולה זו!
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(category)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          כן, מחק הכל
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Delete All Button */}
          <div className="flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="lg"
                  disabled={isLoading === 'all'}
                  className="gap-2"
                >
                  {isLoading === 'all' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-5 w-5" />
                  )}
                  איפוס מלא של המערכת
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    אזהרה קריטית!
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      פעולה זו תמחק את <strong>כל הנתונים</strong> במערכת כולל:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>לקוחות ופרויקטים</li>
                      <li>משימות ופגישות</li>
                      <li>חשבוניות והצעות מחיר</li>
                      <li>רישומי זמן והוצאות</li>
                      <li>קבצים והודעות</li>
                    </ul>
                    <p className="font-medium text-destructive">
                      לא ניתן לבטל פעולה זו!
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>ביטול</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    כן, מחק הכל ואפס את המערכת
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
