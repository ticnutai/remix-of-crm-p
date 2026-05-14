// GroupEntriesDialog - admin view of all time entries for a clicked group (user/client/project/date)
// Allows inline edit of duration, description, billable, hourly rate, plus delete.
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Save, X, Trash2, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  client_id: string | null;
  description: string | null;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  is_billable: boolean | null;
  hourly_rate: number | null;
  created_at: string;
}

interface NamedItem { id: string; name: string }
interface UserItem { id: string; name: string; email?: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  groupColor: string;
  entries: TimeEntry[];
  users: UserItem[];
  clients: NamedItem[];
  projects: NamedItem[];
  canEdit: boolean;
}

interface EditState {
  description: string;
  duration_hours: number;
  duration_minutes: number;
  is_billable: boolean;
  hourly_rate: number;
}

export function GroupEntriesDialog({
  open,
  onOpenChange,
  groupName,
  groupColor,
  entries,
  users,
  clients,
  projects,
  canEdit,
}: Props) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditState(null);
    }
  }, [open]);

  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) =>
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
      ),
    [entries],
  );

  const totals = useMemo(() => {
    const total = entries.reduce((s, e) => s + (e.duration_minutes || 0), 0);
    const billable = entries
      .filter((e) => e.is_billable)
      .reduce((s, e) => s + (e.duration_minutes || 0), 0);
    const revenue = entries
      .filter((e) => e.is_billable)
      .reduce(
        (s, e) => s + ((e.duration_minutes || 0) / 60) * (e.hourly_rate || 0),
        0,
      );
    return { total, billable, revenue, count: entries.length };
  }, [entries]);

  const fmtDur = (mins: number) => {
    if (!mins) return "0 דק'";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} דק'`;
    if (m === 0) return `${h}:0`;
    return `${h}:${m < 10 ? `${m}` : m}`;
  };

  const startEdit = (entry: TimeEntry) => {
    const dm = entry.duration_minutes || 0;
    setEditingId(entry.id);
    setEditState({
      description: entry.description || "",
      duration_hours: Math.floor(dm / 60),
      duration_minutes: dm % 60,
      is_billable: entry.is_billable ?? true,
      hourly_rate: entry.hourly_rate || 0,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
  };

  const saveEdit = async (entry: TimeEntry) => {
    if (!editState) return;
    setSaving(true);
    try {
      const newDuration =
        editState.duration_hours * 60 + editState.duration_minutes;
      const start = new Date(entry.start_time);
      const newEnd = new Date(start.getTime() + newDuration * 60_000);
      const { error } = await supabase
        .from("time_entries")
        .update({
          description: editState.description || null,
          end_time: newEnd.toISOString(), // duration_minutes is a generated column — update end_time instead
          is_billable: editState.is_billable,
          hourly_rate: editState.hourly_rate || null,
        })
        .eq("id", entry.id);
      if (error) throw error;
      toast({ title: "נשמר", description: "הרישום עודכן בהצלחה" });
      cancelEdit();
    } catch (e: any) {
      toast({
        title: "שגיאה בעדכון",
        description: e?.message || "לא ניתן לעדכן",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (entry: TimeEntry) => {
    if (!confirm("למחוק את הרישום?")) return;
    try {
      const { error } = await supabase
        .from("time_entries")
        .delete()
        .eq("id", entry.id);
      if (error) throw error;
      toast({ title: "נמחק", description: "הרישום נמחק" });
    } catch (e: any) {
      toast({
        title: "שגיאה במחיקה",
        description: e?.message || "לא ניתן למחוק",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] flex flex-col rtl"
        style={{ background: "#FFFFFF" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-right">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: groupColor }}
            />
            רישומים — {groupName}
          </DialogTitle>
          <DialogDescription className="text-right">
            {totals.count} רישומים • {fmtDur(totals.total)} סה"כ •{" "}
            {fmtDur(totals.billable)} לחיוב •{" "}
            {new Intl.NumberFormat("he-IL", {
              style: "currency",
              currency: "ILS",
              maximumFractionDigits: 0,
            }).format(totals.revenue)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-2">
            {sorted.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                אין רישומים בקבוצה זו
              </div>
            )}
            {sorted.map((entry) => {
              const user = users.find((u) => u.id === entry.user_id);
              const client = clients.find((c) => c.id === entry.client_id);
              const project = projects.find((p) => p.id === entry.project_id);
              const isEditing = editingId === entry.id;

              return (
                <div
                  key={entry.id}
                  className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                  style={{ borderColor: isEditing ? groupColor : undefined }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(parseISO(entry.start_time), "EEE d MMM yyyy, HH:mm", {
                            locale: he,
                          })}
                        </span>
                        {user && (
                          <Badge variant="outline" className="text-xs">
                            {user.name}
                          </Badge>
                        )}
                        {client && (
                          <Badge variant="outline" className="text-xs">
                            {client.name}
                          </Badge>
                        )}
                        {project && (
                          <Badge variant="outline" className="text-xs">
                            {project.name}
                          </Badge>
                        )}
                      </div>

                      {isEditing && editState ? (
                        <div className="space-y-2 pt-2">
                          <Input
                            value={editState.description}
                            onChange={(e) =>
                              setEditState({
                                ...editState,
                                description: e.target.value,
                              })
                            }
                            placeholder="תיאור"
                            className="text-right"
                          />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">שעות</label>
                              <Input
                                type="number"
                                min={0}
                                value={editState.duration_hours}
                                onChange={(e) =>
                                  setEditState({
                                    ...editState,
                                    duration_hours: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">דקות</label>
                              <Input
                                type="number"
                                min={0}
                                max={59}
                                value={editState.duration_minutes}
                                onChange={(e) =>
                                  setEditState({
                                    ...editState,
                                    duration_minutes: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">תעריף שעתי (₪)</label>
                              <Input
                                type="number"
                                min={0}
                                value={editState.hourly_rate}
                                onChange={(e) =>
                                  setEditState({
                                    ...editState,
                                    hourly_rate: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <Switch
                                checked={editState.is_billable}
                                onCheckedChange={(v) =>
                                  setEditState({ ...editState, is_billable: v })
                                }
                              />
                              <span className="text-xs">לחיוב</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          {entry.description || (
                            <span className="text-muted-foreground italic">ללא תיאור</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge style={{ backgroundColor: `${groupColor}20`, color: groupColor }}>
                        {fmtDur(entry.duration_minutes || 0)}
                      </Badge>
                      {entry.is_billable && entry.hourly_rate ? (
                        <span className="text-xs text-muted-foreground">
                          {Math.round(((entry.duration_minutes || 0) / 60) * entry.hourly_rate)} ₪
                        </span>
                      ) : null}

                      {canEdit && (
                        <div className="flex items-center gap-1 mt-1">
                          {isEditing ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => saveEdit(entry)}
                                disabled={saving}
                              >
                                <Save className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={cancelEdit}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => startEdit(entry)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteEntry(entry)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
