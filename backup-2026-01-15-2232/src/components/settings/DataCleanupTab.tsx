import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

export function DataCleanupTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);

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

  const handleDelete = async (category: DataCategory) => {
    if (!user) return;
    
    setIsLoading(category.id);
    try {
      // Delete all records from the table
      const { error } = await supabase
        .from(category.tableName as any)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This will match all records

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
        await supabase
          .from(tableName as any)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
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
