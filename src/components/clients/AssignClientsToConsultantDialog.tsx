// Dialog to assign/remove clients from a specific consultant.
// Syncs to client_consultants table — reflected in Stages popover & Client profile.
import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, UserCog, Loader2, Check } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  consultantId: string;
  consultantName: string;
  consultantProfession?: string | null;
  onSaved?: () => void;
}

export function AssignClientsToConsultantDialog({
  open,
  onOpenChange,
  consultantId,
  consultantName,
  consultantProfession,
  onSaved,
}: Props) {
  const { clients, loading: clientsLoading } = useClients();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load current assignments
  useEffect(() => {
    if (!open || !consultantId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("client_consultants")
        .select("client_id")
        .eq("consultant_id", consultantId)
        .eq("status", "active");
      if (cancelled) return;
      if (error) {
        toast.error("שגיאה בטעינת לקוחות משויכים");
      } else {
        const ids = new Set((data || []).map((r: any) => r.client_id));
        setSelectedIds(new Set(ids));
        setInitialIds(new Set(ids));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, consultantId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = clients || [];
    const sorted = [...list].sort((a, b) => {
      // Selected first
      const aSel = selectedIds.has(a.id) ? 0 : 1;
      const bSel = selectedIds.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return (a.name || "").localeCompare(b.name || "", "he");
    });
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.phone || "").includes(q),
    );
  }, [clients, search, selectedIds]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const changesCount = useMemo(() => {
    let added = 0,
      removed = 0;
    selectedIds.forEach((id) => {
      if (!initialIds.has(id)) added++;
    });
    initialIds.forEach((id) => {
      if (!selectedIds.has(id)) removed++;
    });
    return { added, removed, total: added + removed };
  }, [selectedIds, initialIds]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      selectedIds.forEach((id) => {
        if (!initialIds.has(id)) toAdd.push(id);
      });
      initialIds.forEach((id) => {
        if (!selectedIds.has(id)) toRemove.push(id);
      });

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from("client_consultants")
          .delete()
          .eq("consultant_id", consultantId)
          .in("client_id", toRemove);
        if (error) throw error;
      }

      if (toAdd.length > 0) {
        const rows = toAdd.map((client_id) => ({
          client_id,
          consultant_id: consultantId,
          status: "active",
          role: consultantProfession || null,
        }));
        const { error } = await supabase
          .from("client_consultants")
          .upsert(rows, { onConflict: "client_id,consultant_id" });
        if (error) throw error;
      }

      toast.success(
        `נשמר בהצלחה · נוספו ${toAdd.length} · הוסרו ${toRemove.length}`,
      );
      setInitialIds(new Set(selectedIds));
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "שגיאה בשמירה");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl p-0 overflow-hidden rtl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 border-b text-right">
          <DialogTitle className="flex items-center gap-2 flex-row-reverse justify-start">
            <UserCog className="h-5 w-5 text-primary" />
            <span>ניהול לקוחות משויכים</span>
          </DialogTitle>
          <div className="text-xs text-muted-foreground mt-1">
            {consultantName}
            {consultantProfession && (
              <Badge variant="outline" className="mr-2 text-[10px]">
                {consultantProfession}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חפש לקוח, חברה או טלפון..."
              className="pr-8 h-9"
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
            <span>
              {selectedIds.size} משויכים · {filtered.length} מוצגים
            </span>
            {changesCount.total > 0 && (
              <span className="text-primary font-medium">
                שינויים: +{changesCount.added} / −{changesCount.removed}
              </span>
            )}
          </div>
        </div>

        <ScrollArea className="h-[420px]">
          {loading || clientsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-12">
              לא נמצאו לקוחות
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((c) => {
                const active = selectedIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggle(c.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-right hover:bg-muted/60 transition-colors",
                      active && "bg-primary/5",
                    )}
                  >
                    <Checkbox
                      checked={active}
                      className="pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-right">
                        {c.name}
                      </div>
                      {(c.company || c.phone) && (
                        <div className="text-[11px] text-muted-foreground truncate text-right">
                          {c.company}
                          {c.company && c.phone ? " · " : ""}
                          {c.phone}
                        </div>
                      )}
                    </div>
                    {active && initialIds.has(c.id) && (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="p-3 border-t flex-row-reverse gap-2">
          <Button
            onClick={handleSave}
            disabled={saving || loading || changesCount.total === 0}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
            שמירה ({changesCount.total})
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
