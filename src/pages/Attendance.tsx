// Attendance — employee self-service clock in/out + history.
import React, { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { LogIn, LogOut, Coffee, Edit2, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MonthlyTimesheet } from "@/components/attendance/MonthlyTimesheet";
import {
  AttendanceRecord, getOpenShift, clockIn, clockOut,
  getOpenBreak, startBreak, endBreak,
  listMyRecords, formatTime, formatDate, formatMinutes, ymd,
  exportDetailToExcel,
  AttendanceBreak,
} from "@/lib/attendance";
import { supabase } from "@/integrations/supabase/client";

export default function Attendance() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [openShift, setOpenShift]   = useState<AttendanceRecord | null>(null);
  const [openBreak, setOpenBreak2]  = useState<AttendanceBreak | null>(null);
  const [records, setRecords]       = useState<AttendanceRecord[]>([]);
  const [loading, setLoading]       = useState(false);
  const [notes, setNotes]           = useState("");
  const [now, setNow]               = useState(Date.now());
  const [monthOffset, setMonthOffset] = useState(0); // 0 = this month
  const [editing, setEditing]       = useState<AttendanceRecord | null>(null);

  const range = useMemo(() => {
    const ref = new Date();
    ref.setMonth(ref.getMonth() + monthOffset);
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const to   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
    return { from, to, label: `${from.getMonth() + 1}/${from.getFullYear()}` };
  }, [monthOffset]);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [shift, recs] = await Promise.all([
        getOpenShift(user.id),
        listMyRecords(user.id, range.from.toISOString(), range.to.toISOString()),
      ]);
      setOpenShift(shift);
      setRecords(recs);
      if (shift) {
        const br = await getOpenBreak(shift.id);
        setOpenBreak2(br);
      } else {
        setOpenBreak2(null);
      }
    } catch (e: any) {
      toast({ title: "שגיאה בטעינה", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id, monthOffset]);

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const elapsedMin = openShift
    ? Math.max(0, Math.floor((now - new Date(openShift.clock_in).getTime()) / 60000) - (openShift.break_minutes ?? 0))
    : 0;

  const monthlyMinutes = records
    .filter(r => r.clock_out)
    .reduce((s, r) => s + (r.duration_minutes ?? 0), 0);

  // ---- actions ----
  const doClockIn = async () => {
    if (!user) return;
    try {
      await clockIn(user.id);
      toast({ title: "כניסה נרשמה", description: `שלום ${profile?.full_name ?? ""}` });
      refresh();
    } catch (e: any) {
      toast({ title: "שגיאה בכניסה", description: e.message, variant: "destructive" });
    }
  };

  const doClockOut = async () => {
    if (!openShift) return;
    try {
      if (openBreak) await endBreak(openBreak.id);
      await clockOut(openShift.id, notes || undefined);
      setNotes("");
      toast({ title: "יציאה נרשמה", description: "יום נעים!" });
      refresh();
    } catch (e: any) {
      toast({ title: "שגיאה ביציאה", description: e.message, variant: "destructive" });
    }
  };

  const toggleBreak = async () => {
    if (!openShift || !user) return;
    try {
      if (openBreak) {
        await endBreak(openBreak.id);
        toast({ title: "חזרת מהפסקה" });
      } else {
        await startBreak(openShift.id, user.id);
        toast({ title: "יצאת להפסקה" });
      }
      refresh();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-5xl space-y-4" dir="rtl">
        <h1 className="text-2xl font-bold">נוכחות יומית</h1>
        <p className="text-muted-foreground">
          {profile?.full_name ?? user?.email} — דיווח שעות עבודה
        </p>

        <Tabs defaultValue="timesheet" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timesheet">גיליון חודשי</TabsTrigger>
            <TabsTrigger value="quick">כניסה מהירה / היסטוריה</TabsTrigger>
          </TabsList>

          <TabsContent value="timesheet" className="space-y-4">
            {user && (
              <MonthlyTimesheet
                userId={user.id}
                employeeName={profile?.full_name ?? user.email ?? undefined}
                isManager={false}
              />
            )}
          </TabsContent>

          <TabsContent value="quick" className="space-y-4">
        {/* Clock in/out card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {openShift ? (
                <span className="text-green-600">בעבודה — {formatMinutes(elapsedMin)}</span>
              ) : (
                <span className="text-muted-foreground">לא בעבודה</span>
              )}
            </CardTitle>
            {openShift && (
              <CardDescription>
                כניסה: {formatTime(openShift.clock_in)} ({formatDate(openShift.clock_in)})
                {openShift.break_minutes ? ` • הפסקות: ${formatMinutes(openShift.break_minutes)}` : ""}
                {openBreak ? " • בהפסקה כעת" : ""}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {!openShift ? (
              <Button size="lg" className="w-full h-20 text-xl" onClick={doClockIn}>
                <LogIn className="ml-2 h-6 w-6" /> כניסה לעבודה
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={openBreak ? "default" : "outline"}
                    size="lg"
                    className="h-16"
                    onClick={toggleBreak}
                  >
                    <Coffee className="ml-2 h-5 w-5" />
                    {openBreak ? "חזרה מהפסקה" : "הפסקה"}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-16"
                    onClick={doClockOut}
                    disabled={!!openBreak}
                  >
                    <LogOut className="ml-2 h-5 w-5" /> יציאה
                  </Button>
                </div>
                <div>
                  <Label>הערה ליציאה (אופציונלי)</Label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="מה עשית היום? בעיות / משימות שנותרו..."
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>חודש {range.label}</CardTitle>
              <CardDescription>
                סה״כ {formatMinutes(monthlyMinutes)} ב־{records.filter(r => r.clock_out).length} משמרות
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o - 1)}>
                ◀ קודם
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(0)} disabled={monthOffset === 0}>
                החודש
              </Button>
              <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0}>
                הבא ▶
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportDetailToExcel(records, range.label)}>
                <Download className="ml-1 h-4 w-4" /> Excel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-right">
                    <th className="p-2">תאריך</th>
                    <th className="p-2">כניסה</th>
                    <th className="p-2">יציאה</th>
                    <th className="p-2">סה״כ</th>
                    <th className="p-2">הפסקה</th>
                    <th className="p-2">הערות</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">טוען...</td></tr>
                  )}
                  {!loading && records.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">אין רישומים בחודש זה</td></tr>
                  )}
                  {records.map(r => (
                    <tr key={r.id} className="border-b hover:bg-muted/40">
                      <td className="p-2">{formatDate(r.clock_in)}</td>
                      <td className="p-2">{formatTime(r.clock_in)}</td>
                      <td className="p-2">
                        {r.clock_out ? formatTime(r.clock_out) : <Badge variant="outline">פתוח</Badge>}
                      </td>
                      <td className="p-2">{r.clock_out ? formatMinutes(r.duration_minutes ?? 0) : "—"}</td>
                      <td className="p-2">{formatMinutes(r.break_minutes ?? 0)}</td>
                      <td className="p-2 max-w-[200px] truncate">{r.notes ?? ""}</td>
                      <td className="p-2">
                        {r.is_edited && <Badge variant="secondary" className="ml-1">נערך</Badge>}
                        {r.clock_out && (
                          <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit dialog */}
      {editing && (
        <EditRecordDialog
          record={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </AppLayout>
  );
}

function EditRecordDialog({
  record, onClose, onSaved,
}: { record: AttendanceRecord; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [clockInLocal, setClockInLocal]   = useState(toLocalInput(record.clock_in));
  const [clockOutLocal, setClockOutLocal] = useState(toLocalInput(record.clock_out));
  const [notes, setNotes] = useState(record.notes ?? "");
  const [breakMin, setBreakMin] = useState<number>(record.break_minutes ?? 0);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("attendance_records" as any)
        .update({
          clock_in: new Date(clockInLocal).toISOString(),
          clock_out: clockOutLocal ? new Date(clockOutLocal).toISOString() : null,
          notes,
          break_minutes: Number(breakMin) || 0,
          is_edited: true,
          edited_by: user?.id,
          edited_at: new Date().toISOString(),
        })
        .eq("id", record.id);
      if (error) throw error;
      toast({ title: "נשמר" });
      onSaved();
    } catch (e: any) {
      toast({ title: "שגיאה בשמירה", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת רישום</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>כניסה</Label>
            <Input type="datetime-local" value={clockInLocal} onChange={e => setClockInLocal(e.target.value)} />
          </div>
          <div>
            <Label>יציאה</Label>
            <Input type="datetime-local" value={clockOutLocal} onChange={e => setClockOutLocal(e.target.value)} />
          </div>
          <div>
            <Label>הפסקה (דקות)</Label>
            <Input type="number" min={0} value={breakMin} onChange={e => setBreakMin(Number(e.target.value))} />
          </div>
          <div>
            <Label>הערה</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={save} disabled={saving}>שמירה</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
