// Attendance Admin — manager dashboard with summary, daily detail,
// missing-days detection, edit any record, exports.
import React, { useEffect, useMemo, useState } from "react";
import { useSyncedSetting } from "@/hooks/useSyncedSetting";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileText, AlertTriangle, Edit2, Mail } from "lucide-react";
import { MonthlyTimesheet } from "@/components/attendance/MonthlyTimesheet";
import {
  AttendanceRecord, listAllRecords,
  summarizeByUser, findMissingDays,
  formatDate, formatTime, formatMinutes,
  exportSummaryToExcel, exportDetailToExcel, exportSummaryToPdf,
} from "@/lib/attendance";
import { supabase } from "@/integrations/supabase/client";

export default function AttendanceAdmin() {
  const { isAdmin, isManager, isSuperManager, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [userFilter, setUserFilter] = useSyncedSetting<string>({ key: "attendance-admin-user-filter", defaultValue: "all" });
  const [editing, setEditing] = useState<AttendanceRecord | null>(null);
  const [activeTab, setActiveTab] = useSyncedSetting<string>({ key: "attendance-admin-tab", defaultValue: "summary" });

  const allowed = isAdmin || isManager || isSuperManager;

  useEffect(() => {
    if (!isLoading && !allowed) navigate("/");
  }, [isLoading, allowed, navigate]);

  const range = useMemo(() => {
    const ref = new Date();
    ref.setMonth(ref.getMonth() + monthOffset);
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const to   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
    return { from, to, label: `${from.getMonth() + 1}/${from.getFullYear()}` };
  }, [monthOffset]);

  const refresh = async () => {
    setLoading(true);
    try {
      const recs = await listAllRecords(range.from.toISOString(), range.to.toISOString());
      setRecords(recs);
    } catch (e: any) {
      toast({ title: "שגיאה בטעינה", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (allowed) refresh(); /* eslint-disable-next-line */ }, [allowed, monthOffset]);

  const summary = useMemo(() => summarizeByUser(records), [records]);
  const filtered = useMemo(() => userFilter === "all" ? records : records.filter(r => r.user_id === userFilter), [records, userFilter]);
  const missing  = useMemo(() => findMissingDays(records, range.from, new Date()), [records, range]);

  const totalAll = summary.reduce((s, u) => s + u.total_minutes, 0);
  const totalOt  = summary.reduce((s, u) => s + u.overtime_minutes, 0);

  return (
    <AppLayout>
      <div className="container mx-auto p-4 space-y-4" dir="rtl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">נוכחות עובדים — מנהל</h1>
            <p className="text-muted-foreground">חודש {range.label}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o - 1)}>◀ קודם</Button>
            <Button variant="outline" size="sm" onClick={() => setMonthOffset(0)} disabled={monthOffset === 0}>החודש</Button>
            <Button variant="outline" size="sm" onClick={() => setMonthOffset(o => o + 1)} disabled={monthOffset >= 0}>הבא ▶</Button>
            <Button variant="outline" size="sm" onClick={() => exportSummaryToExcel(summary, range.label)}>
              <Download className="ml-1 h-4 w-4" /> Excel סיכום
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportDetailToExcel(records, range.label)}>
              <Download className="ml-1 h-4 w-4" /> Excel פירוט
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportSummaryToPdf(summary, range.label)}>
              <FileText className="ml-1 h-4 w-4" /> PDF
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="סה״כ עובדים" value={summary.length.toString()} />
          <Stat label="סה״כ שעות" value={formatMinutes(totalAll)} />
          <Stat label="שעות נוספות" value={formatMinutes(totalOt)} />
          <Stat label="חוסרי יציאה" value={summary.reduce((s, u) => s + u.missing_clock_outs, 0).toString()} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="summary">סיכום לעובד</TabsTrigger>
            <TabsTrigger value="detail">פירוט יומי</TabsTrigger>
            <TabsTrigger value="missing">חוסרים</TabsTrigger>
            <TabsTrigger value="timesheet">עריכה ידנית</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardContent className="pt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">עובד</th>
                      <th className="p-2">אימייל</th>
                      <th className="p-2">משמרות</th>
                      <th className="p-2">סה״כ</th>
                      <th className="p-2">הפסקות</th>
                      <th className="p-2">שעות נוספות</th>
                      <th className="p-2">חוסר יציאה</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && <tr><td colSpan={7} className="p-4 text-center">טוען...</td></tr>}
                    {!loading && summary.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">אין נתונים</td></tr>}
                    {summary.map(u => (
                      <tr key={u.user_id} className="border-b hover:bg-muted/40">
                        <td className="p-2 font-medium">{u.full_name}</td>
                        <td className="p-2 text-xs text-muted-foreground">{u.email}</td>
                        <td className="p-2">{u.shifts}</td>
                        <td className="p-2 font-semibold">{formatMinutes(u.total_minutes)}</td>
                        <td className="p-2">{formatMinutes(u.break_minutes)}</td>
                        <td className="p-2 text-orange-600">{formatMinutes(u.overtime_minutes)}</td>
                        <td className="p-2">
                          {u.missing_clock_outs > 0
                            ? <Badge variant="destructive">{u.missing_clock_outs}</Badge>
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detail">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Label>סינון עובד:</Label>
                  <Select value={userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כולם</SelectItem>
                      {summary.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-right">
                      <th className="p-2">תאריך</th>
                      <th className="p-2">עובד</th>
                      <th className="p-2">כניסה</th>
                      <th className="p-2">יציאה</th>
                      <th className="p-2">סה״כ</th>
                      <th className="p-2">הפסקה</th>
                      <th className="p-2">הערות</th>
                      <th className="p-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={r.id} className="border-b hover:bg-muted/40">
                        <td className="p-2">{formatDate(r.clock_in)}</td>
                        <td className="p-2">{r.profile?.full_name ?? r.user_id.slice(0, 8)}</td>
                        <td className="p-2">{formatTime(r.clock_in)}</td>
                        <td className="p-2">{r.clock_out ? formatTime(r.clock_out) : <Badge variant="outline">פתוח</Badge>}</td>
                        <td className="p-2">{formatMinutes(r.duration_minutes ?? 0)}</td>
                        <td className="p-2">{formatMinutes(r.break_minutes ?? 0)}</td>
                        <td className="p-2 max-w-[260px] truncate">{r.notes ?? ""}</td>
                        <td className="p-2">
                          {r.is_edited && <Badge variant="secondary" className="ml-1">נערך</Badge>}
                          <Button variant="ghost" size="sm" onClick={() => setEditing(r)}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="missing">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  ימים ללא דיווח (א׳–ה׳)
                </CardTitle>
                <CardDescription>עד התאריך של היום</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {summary.length === 0 && <div className="text-muted-foreground">אין נתונים</div>}
                {summary.map(u => {
                  const days = missing[u.user_id] ?? [];
                  return (
                    <div key={u.user_id} className="border rounded p-3">
                      <div className="font-medium mb-1">{u.full_name}</div>
                      {days.length === 0
                        ? <span className="text-green-600 text-sm">דיווח מלא ✓</span>
                        : (
                          <div className="flex flex-wrap gap-1">
                            {days.map(d => <Badge key={d} variant="destructive">{d}</Badge>)}
                          </div>
                        )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timesheet">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Label>בחר עובד:</Label>
                  <Select value={userFilter === "all" ? (summary[0]?.user_id ?? "") : userFilter} onValueChange={setUserFilter}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="בחר עובד" />
                    </SelectTrigger>
                    <SelectContent>
                      {summary.map(u => (
                        <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || u.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const sel = userFilter !== "all" ? userFilter : (summary[0]?.user_id ?? "");
                  const selUser = summary.find(s => s.user_id === sel);
                  if (!sel) return <p className="text-muted-foreground p-4">אין עובדים להצגה</p>;
                  return (
                    <MonthlyTimesheet
                      userId={sel}
                      employeeName={selUser?.full_name ?? selUser?.email}
                      isManager={true}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {editing && (
          <ManagerEditDialog
            record={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
          />
        )}
      </div>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function ManagerEditDialog({
  record, onClose, onSaved,
}: { record: AttendanceRecord; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
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
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm("למחוק רישום זה?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("attendance_records" as any).delete().eq("id", record.id);
      if (error) throw error;
      toast({ title: "נמחק" });
      onSaved();
    } catch (e: any) {
      toast({ title: "שגיאה", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>עריכת רישום (מנהל)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {record.profile?.full_name ?? record.user_id}
          </div>
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
        <DialogFooter className="justify-between">
          <Button variant="destructive" onClick={remove} disabled={saving}>מחיקה</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>ביטול</Button>
            <Button onClick={save} disabled={saving}>שמירה</Button>
          </div>
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
