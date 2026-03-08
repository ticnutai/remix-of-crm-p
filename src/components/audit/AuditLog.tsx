// לוג שינויים (Audit Log)
// מעקב אחרי כל השינויים במערכת

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  History,
  User,
  FileText,
  Users,
  Briefcase,
  DollarSign,
  Search,
  Eye,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow, subDays } from 'date-fns';
import { he } from 'date-fns/locale';

// טיפוסים
interface AuditEntry {
  id: string;
  entity_type: 'client' | 'project' | 'contract' | 'payment' | 'time_entry';
  entity_id: string;
  entity_name?: string;
  action: 'create' | 'update' | 'delete';
  changes: Record<string, { old: any; new: any }>;
  user_id: string;
  user_name?: string;
  created_at: string;
}

// אייקונים לפי סוג
const ENTITY_ICONS: Record<string, React.ReactNode> = {
  client: <Users className="h-4 w-4" />,
  project: <Briefcase className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  payment: <DollarSign className="h-4 w-4" />,
  time_entry: <History className="h-4 w-4" />,
};

// תוויות
const ENTITY_LABELS: Record<string, string> = {
  client: 'לקוח',
  project: 'פרויקט',
  contract: 'חוזה',
  payment: 'תשלום',
  time_entry: 'רשומת זמן',
};

const ACTION_LABELS: Record<string, string> = {
  create: 'נוצר',
  update: 'עודכן',
  delete: 'נמחק',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <Plus className="h-3 w-3" />,
  update: <Pencil className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
};

// תרגום שמות שדות
const FIELD_LABELS: Record<string, string> = {
  contact_name: 'שם',
  company: 'חברה',
  email: 'אימייל',
  phone: 'טלפון',
  city: 'עיר',
  address: 'כתובת',
  status: 'סטטוס',
  name: 'שם',
  title: 'כותרת',
  total_amount: 'סכום',
  amount: 'סכום',
  description: 'תיאור',
  start_date: 'תאריך התחלה',
  end_date: 'תאריך סיום',
  due_date: 'תאריך יעד',
  notes: 'הערות',
  gush: 'גוש',
  helka: 'חלקה',
  migrash: 'מגרש',
  taba: 'תב"א',
};

export function AuditLog() {
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [daysBack, setDaysBack] = useState(30);
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  // שליפת לוג
  const { data: auditLog = [], isLoading, refetch } = useQuery({
    queryKey: ['audit-log', entityFilter, actionFilter, daysBack],
    queryFn: async () => {
      const fromDate = subDays(new Date(), daysBack);
      
      let query = (supabase as any)
        .from('audit_log')
        .select('*, profiles(full_name)')
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching audit log:', error);
        return [];
      }
      
      return (data || []).map((entry: any) => ({
        ...entry,
        user_name: entry.profiles?.full_name || 'משתמש לא ידוע',
      })) as AuditEntry[];
    },
  });

  // סינון לפי חיפוש
  const filteredLog = auditLog.filter(entry => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (entry.entity_name || '').toLowerCase().includes(query) ||
      (entry.user_name || '').toLowerCase().includes(query)
    );
  });

  // פורמט שינויים
  const formatChanges = (changes: Record<string, { old: any; new: any }>) => {
    return Object.entries(changes).map(([field, { old: oldVal, new: newVal }]) => ({
      field: FIELD_LABELS[field] || field,
      old: formatValue(oldVal),
      new: formatValue(newVal),
    }));
  };

  // פורמט ערך
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'כן' : 'לא';
    if (typeof value === 'number') {
      if (value > 1000) return value.toLocaleString();
      return value.toString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* כותרת */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6" />
            לוג שינויים
          </h2>
          <p className="text-muted-foreground">
            מעקב אחרי כל הפעולות במערכת
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ml-2" />
          רענן
        </Button>
      </div>

      {/* פילטרים */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="סוג" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הסוגים</SelectItem>
                <SelectItem value="client">לקוחות</SelectItem>
                <SelectItem value="project">פרויקטים</SelectItem>
                <SelectItem value="contract">חוזים</SelectItem>
                <SelectItem value="payment">תשלומים</SelectItem>
                <SelectItem value="time_entry">רשומות זמן</SelectItem>
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="פעולה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הפעולות</SelectItem>
                <SelectItem value="create">יצירה</SelectItem>
                <SelectItem value="update">עדכון</SelectItem>
                <SelectItem value="delete">מחיקה</SelectItem>
              </SelectContent>
            </Select>
            <Select value={daysBack.toString()} onValueChange={(v) => setDaysBack(parseInt(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">שבוע אחרון</SelectItem>
                <SelectItem value="30">חודש אחרון</SelectItem>
                <SelectItem value="90">3 חודשים</SelectItem>
                <SelectItem value="365">שנה</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* טבלת לוג */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : filteredLog.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>אין פעולות להצגה</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>זמן</TableHead>
                  <TableHead>משתמש</TableHead>
                  <TableHead>פעולה</TableHead>
                  <TableHead>סוג</TableHead>
                  <TableHead>פריט</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(entry.created_at), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{entry.user_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${ACTION_COLORS[entry.action]} border-0`}>
                        <span className="ml-1">{ACTION_ICONS[entry.action]}</span>
                        {ACTION_LABELS[entry.action]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {ENTITY_ICONS[entry.entity_type]}
                        <span className="text-sm">{ENTITY_LABELS[entry.entity_type]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {entry.entity_name || entry.entity_id}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.action === 'update' && Object.keys(entry.changes || {}).length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* דיאלוג פרטי שינויים */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>פרטי השינויים</DialogTitle>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              {/* מידע כללי */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">סוג:</span>
                  <span className="mr-2 font-medium">
                    {ENTITY_LABELS[selectedEntry.entity_type]}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">פריט:</span>
                  <span className="mr-2 font-medium">
                    {selectedEntry.entity_name || selectedEntry.entity_id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">משתמש:</span>
                  <span className="mr-2 font-medium">{selectedEntry.user_name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">זמן:</span>
                  <span className="mr-2 font-medium">
                    {format(new Date(selectedEntry.created_at), 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>

              {/* טבלת שינויים */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>שדה</TableHead>
                      <TableHead>ערך קודם</TableHead>
                      <TableHead>ערך חדש</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formatChanges(selectedEntry.changes || {}).map(({ field, old, new: newVal }, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{field}</TableCell>
                        <TableCell className="text-red-600">{old}</TableCell>
                        <TableCell className="text-green-600">{newVal}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AuditLog;
