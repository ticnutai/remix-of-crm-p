import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Check,
  Layers,
  Loader2,
  Search,
  User,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ClientListItem = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
};

interface ManageStageTemplateClientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stageTemplateId: string | null;
  stageTemplateName: string;
  onSaved?: () => void | Promise<void>;
}

export function ManageStageTemplateClientsDialog({
  open,
  onOpenChange,
  stageTemplateId,
  stageTemplateName,
  onSaved,
}: ManageStageTemplateClientsDialogProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [assignedClientIds, setAssignedClientIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingClientIds, setPendingClientIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);

  useEffect(() => {
    if (!open || !stageTemplateId) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setSearch("");
      setShowAssignedOnly(false);
      try {
        const [clientsResponse, assignmentsResponse] = await Promise.all([
          supabase
            .from("clients")
            .select("id, name, company, email, phone")
            .order("name"),
          (supabase as any)
            .from("client_process_categories")
            .select("client_id")
            .eq("stage_template_id", stageTemplateId),
        ]);

        if (clientsResponse.error) throw clientsResponse.error;
        if (assignmentsResponse.error) throw assignmentsResponse.error;
        if (cancelled) return;

        const assigned = new Set<string>(
          (assignmentsResponse.data || []).map(
            (row: { client_id: string }) => row.client_id,
          ),
        );
        setClients((clientsResponse.data || []) as ClientListItem[]);
        setAssignedClientIds(assigned);
        setPendingClientIds(new Set(assigned));
      } catch (error) {
        console.error("Failed loading process category clients:", error);
        toast({
          title: "לא ניתן לטעון את הלקוחות",
          description: "נסה לסגור ולפתוח שוב את חלון הסיווג.",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, stageTemplateId, toast]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("he");
    return clients.filter((client) => {
      if (showAssignedOnly && !pendingClientIds.has(client.id)) return false;
      if (!query) return true;
      return [client.name, client.company, client.email, client.phone]
        .filter(Boolean)
        .some((value) =>
          String(value).toLocaleLowerCase("he").includes(query),
        );
    });
  }, [clients, pendingClientIds, search, showAssignedOnly]);

  const addedIds = useMemo(
    () =>
      Array.from(pendingClientIds).filter(
        (clientId) => !assignedClientIds.has(clientId),
      ),
    [assignedClientIds, pendingClientIds],
  );
  const removedIds = useMemo(
    () =>
      Array.from(assignedClientIds).filter(
        (clientId) => !pendingClientIds.has(clientId),
      ),
    [assignedClientIds, pendingClientIds],
  );
  const hasChanges = addedIds.length > 0 || removedIds.length > 0;

  const toggleClient = (clientId: string) => {
    setPendingClientIds((current) => {
      const next = new Set(current);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const selectVisible = () => {
    setPendingClientIds((current) => {
      const next = new Set(current);
      filteredClients.forEach((client) => next.add(client.id));
      return next;
    });
  };

  const clearVisible = () => {
    setPendingClientIds((current) => {
      const next = new Set(current);
      filteredClients.forEach((client) => next.delete(client.id));
      return next;
    });
  };

  const save = async () => {
    if (!stageTemplateId || !hasChanges) return;
    setSaving(true);
    try {
      if (addedIds.length > 0) {
        const { error } = await (supabase as any)
          .from("client_process_categories")
          .upsert(
            addedIds.map((clientId) => ({
              client_id: clientId,
              stage_template_id: stageTemplateId,
            })),
            { onConflict: "client_id,stage_template_id" },
          );
        if (error) throw error;
      }

      if (removedIds.length > 0) {
        const { error } = await (supabase as any)
          .from("client_process_categories")
          .delete()
          .eq("stage_template_id", stageTemplateId)
          .in("client_id", removedIds);
        if (error) throw error;
      }

      await onSaved?.();
      toast({
        title: "סיווג הלקוחות עודכן",
        description: [
          addedIds.length > 0 ? `${addedIds.length} נוספו` : "",
          removedIds.length > 0 ? `${removedIds.length} הוסרו` : "",
        ]
          .filter(Boolean)
          .join(" · "),
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed saving process category clients:", error);
      toast({
        title: "לא ניתן לשמור את הסיווג",
        description:
          "לא בוצע שינוי בשלבים, במשימות או בתשלומים. נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir="rtl"
        className="flex max-h-[86vh] max-w-2xl flex-col overflow-hidden p-0"
      >
        <DialogHeader className="border-b border-[#d4a843]/30 bg-gradient-to-l from-[#fff8e7] to-white px-5 py-4 text-right">
          <DialogTitle className="flex items-center gap-2 text-[#142a4f]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1e3a5f] text-[#e7b941]">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate">לקוחות בקטגוריה</span>
              <span className="mt-0.5 block truncate text-sm font-medium text-[#9a741d]">
                {stageTemplateName}
              </span>
            </span>
          </DialogTitle>
          <DialogDescription className="pt-1 text-right text-slate-600">
            הסיווג עצמאי ואינו משנה תהליכים, שלבים, משימות או תשלומים.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 px-5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="חפש לפי שם, חברה, טלפון או אימייל..."
                className="border-[#d4a843]/60 pr-9 text-[#142a4f] placeholder:text-slate-500"
              />
            </div>
            <Button
              type="button"
              variant={showAssignedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAssignedOnly((current) => !current)}
              className={cn(
                "gap-1.5",
                showAssignedOnly &&
                  "bg-[#1e3a5f] text-white hover:bg-[#142a4f]",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              משויכים בלבד
              <Badge variant="secondary">{pendingClientIds.size}</Badge>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={selectVisible}>
                בחר את המוצגים
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={clearVisible}>
                הסר את המוצגים
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {addedIds.length > 0 && (
                <Badge className="gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <UserPlus className="h-3 w-3" />
                  {addedIds.length} להוספה
                </Badge>
              )}
              {removedIds.length > 0 && (
                <Badge className="gap-1 bg-red-100 text-red-700 hover:bg-red-100">
                  <UserMinus className="h-3 w-3" />
                  {removedIds.length} להסרה
                </Badge>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="mx-5 my-4 min-h-0 flex-1 rounded-xl border border-[#d4a843]/45 bg-white">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-[#d4a843]" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center text-sm text-slate-600">
              לא נמצאו לקוחות מתאימים
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredClients.map((client) => {
                const checked = pendingClientIds.has(client.id);
                const wasAssigned = assignedClientIds.has(client.id);
                const markedForRemoval = wasAssigned && !checked;
                const newlyAdded = !wasAssigned && checked;
                return (
                  <div
                    key={client.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleClient(client.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleClient(client.id);
                      }
                    }}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-3 rounded-lg border p-3 text-right transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a843]",
                      checked
                        ? "border-emerald-300 bg-emerald-50/70"
                        : "border-transparent bg-slate-50 hover:border-[#d4a843]/50 hover:bg-[#fffaf0]",
                      markedForRemoval && "border-red-200 bg-red-50/70",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      tabIndex={-1}
                      className="pointer-events-none"
                      aria-hidden="true"
                    />
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef3f8] text-[#1e3a5f]">
                      <User className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-sm font-semibold text-[#142a4f]",
                          markedForRemoval && "text-red-700 line-through",
                        )}
                      >
                        {client.name}
                      </span>
                      <span className="block truncate text-[11px] text-slate-600">
                        {[client.company, client.phone, client.email]
                          .filter(Boolean)
                          .join(" · ") || "ללא פרטים נוספים"}
                      </span>
                    </span>
                    {wasAssigned && !markedForRemoval && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        משויך
                      </Badge>
                    )}
                    {newlyAdded && (
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        חדש
                      </Badge>
                    )}
                    {markedForRemoval && (
                      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        יוסר
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="border-t bg-[#fbfaf7] px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            ביטול
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={!hasChanges || saving}
            className="gap-2 bg-[#1e3a5f] text-white hover:bg-[#142a4f]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            שמור שיוכים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
