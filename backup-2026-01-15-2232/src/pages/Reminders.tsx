import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useReminders, Reminder } from '@/hooks/useReminders';
import { AddReminderDialog } from '@/components/reminders/AddReminderDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Trash2, Check, Clock, Mail, Volume2, BellRing, Plus } from 'lucide-react';
import { format, isPast, isFuture, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const reminderTypeIcons: Record<string, React.ReactNode> = {
  browser: <BellRing className="h-4 w-4" />,
  popup: <Bell className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  voice: <Volume2 className="h-4 w-4" />,
};

const reminderTypeLabels: Record<string, string> = {
  browser: 'התראת דפדפן',
  popup: 'חלון קופץ',
  email: 'אימייל',
  voice: 'הקראה קולית',
};

export default function Reminders() {
  const { reminders, loading, deleteReminder, dismissReminder } = useReminders();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const pendingReminders = reminders.filter(r => !r.is_sent && !r.is_dismissed && isFuture(new Date(r.remind_at)));
  const todayReminders = reminders.filter(r => isToday(new Date(r.remind_at)));
  const pastReminders = reminders.filter(r => r.is_sent || r.is_dismissed || isPast(new Date(r.remind_at)));

  const handleDelete = async () => {
    if (deleteId) {
      await deleteReminder(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (reminder: Reminder) => {
    if (reminder.is_dismissed) {
      return <Badge variant="secondary">בוטלה</Badge>;
    }
    if (reminder.is_sent) {
      return <Badge variant="default" className="bg-green-600">נשלחה</Badge>;
    }
    if (isPast(new Date(reminder.remind_at))) {
      return <Badge variant="destructive">פג תוקף</Badge>;
    }
    if (isToday(new Date(reminder.remind_at))) {
      return <Badge className="bg-[hsl(45,80%,45%)] text-white">היום</Badge>;
    }
    return <Badge variant="outline">ממתינה</Badge>;
  };

  const ReminderTable = ({ items }: { items: Reminder[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>כותרת</TableHead>
          <TableHead>זמן</TableHead>
          <TableHead>סוג</TableHead>
          <TableHead>סטטוס</TableHead>
          <TableHead>פעולות</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              אין תזכורות
            </TableCell>
          </TableRow>
        ) : (
          items.map((reminder) => (
            <TableRow key={reminder.id}>
              <TableCell>
                <div>
                  <p className="font-medium">{reminder.title}</p>
                  {reminder.message && (
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {reminder.message}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {format(new Date(reminder.remind_at), 'dd/MM/yyyy HH:mm', { locale: he })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {reminderTypeIcons[reminder.reminder_type] || <Bell className="h-4 w-4" />}
                  <span className="text-sm">
                    {reminderTypeLabels[reminder.reminder_type] || reminder.reminder_type}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(reminder)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {!reminder.is_dismissed && !reminder.is_sent && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dismissReminder(reminder.id)}
                      title="סמן כבוטלה"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(reminder.id)}
                    className="text-destructive hover:text-destructive"
                    title="מחק"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(45,80%,45%)]/10">
              <Bell className="h-6 w-6 text-[hsl(45,80%,45%)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">תזכורות</h1>
              <p className="text-muted-foreground text-sm">ניהול כל התזכורות שלך</p>
            </div>
          </div>
          <AddReminderDialog
            trigger={
              <Button className="gap-2 bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,30%)]">
                <Plus className="h-4 w-4" />
                תזכורת חדשה
              </Button>
            }
          />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                ממתינות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(220,60%,25%)]">
                {pendingReminders.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                היום
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[hsl(45,80%,45%)]">
                {todayReminders.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                סה״כ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reminders.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Reminders Tabs */}
        <Tabs defaultValue="pending" dir="rtl">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              ממתינות ({pendingReminders.length})
            </TabsTrigger>
            <TabsTrigger value="today" className="gap-2">
              <Bell className="h-4 w-4" />
              היום ({todayReminders.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <Check className="h-4 w-4" />
              היסטוריה ({pastReminders.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              כל התזכורות ({reminders.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ReminderTable items={pendingReminders} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="today" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ReminderTable items={todayReminders} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ReminderTable items={pastReminders} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ReminderTable items={reminders} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת תזכורת</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את התזכורת? לא ניתן לבטל פעולה זו.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
