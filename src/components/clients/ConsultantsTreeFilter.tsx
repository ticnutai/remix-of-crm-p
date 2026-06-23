// Consultants Tree Filter — hierarchical tree view (profession → consultants)
// Clicking the profession name toggles ALL consultants under it.
// Clicking the chevron expands/collapses the list of specific consultants.
// Reusable between Clients page (inside Stages popover) and DataTable Pro (Filter Panel).
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, UserCog, Briefcase, Search, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConsultants } from "@/hooks/useConsultants";
import { AssignClientsToConsultantDialog } from "./AssignClientsToConsultantDialog";

export interface ConsultantsTreeFilterProps {
  selectedConsultantIds: string[];
  selectedProfessions: string[];
  onChange: (next: {
    consultantIds: string[];
    consultantProfessions: string[];
  }) => void;
  className?: string;
  /** Optional: counts for badges (clientsCountPerProfession / consultant) */
  clientsCountByConsultantId?: Record<string, number>;
  clientsCountByProfession?: Record<string, number>;
  /** Show internal search input. Defaults to true. */
  showSearch?: boolean;
  /** Compact heading on top. Set false to hide. */
  showHeader?: boolean;
}

export function ConsultantsTreeFilter({
  selectedConsultantIds,
  selectedProfessions,
  onChange,
  className,
  clientsCountByConsultantId,
  clientsCountByProfession,
  showSearch = true,
  showHeader = true,
}: ConsultantsTreeFilterProps) {
  const { consultants, addConsultant, deleteConsultant } = useConsultants();
  const [search, setSearch] = useState("");
  const [newConsultantName, setNewConsultantName] = useState("");
  const [newConsultantProfession, setNewConsultantProfession] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [assignTarget, setAssignTarget] = useState<{
    id: string;
    name: string;
    profession: string | null;
  } | null>(null);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, typeof consultants>();
    for (const c of consultants) {
      const prof = c.profession || "ללא תחום";
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !prof.toLowerCase().includes(q) &&
        !(c.company || "").toLowerCase().includes(q)
      ) {
        continue;
      }
      if (!map.has(prof)) map.set(prof, []);
      map.get(prof)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "he"),
    );
  }, [consultants, search]);

  // Auto-expand a group when searching narrows results
  React.useEffect(() => {
    if (search.trim()) {
      setExpanded(new Set(grouped.map(([p]) => p)));
    }
  }, [search, grouped]);

  const toggleExpand = (prof: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(prof)) next.delete(prof);
      else next.add(prof);
      return next;
    });
  };

  const toggleProfession = (prof: string) => {
    const next = selectedProfessions.includes(prof)
      ? selectedProfessions.filter((p) => p !== prof)
      : [...selectedProfessions, prof];
    onChange({
      consultantIds: selectedConsultantIds,
      consultantProfessions: next,
    });
  };

  const toggleConsultant = (id: string) => {
    const next = selectedConsultantIds.includes(id)
      ? selectedConsultantIds.filter((x) => x !== id)
      : [...selectedConsultantIds, id];
    onChange({
      consultantIds: next,
      consultantProfessions: selectedProfessions,
    });
  };

  const activeCount =
    selectedConsultantIds.length + selectedProfessions.length;

  const clearAll = () => {
    onChange({ consultantIds: [], consultantProfessions: [] });
  };

  const addNewConsultant = async (professionOverride?: string) => {
    const name = newConsultantName.trim();
    const profession = (professionOverride || newConsultantProfession).trim();
    if (!name) return;

    const created = await addConsultant({
      name,
      profession: profession || "יועץ",
      license_number: null,
      id_number: null,
      phone: null,
      email: null,
      company: null,
      specialty: null,
      notes: null,
      user_id: null,
    });

    if (created) {
      setNewConsultantName("");
      if (professionOverride) setNewConsultantProfession(professionOverride);
      setExpanded((prev) => new Set(prev).add(created.profession || professionOverride || "יועץ"));
    }
  };

  const removeConsultant = async (id: string, name: string) => {
    const confirmed = window.confirm(`למחוק את היועץ "${name}" מהרשימה?`);
    if (!confirmed) return;

    const deleted = await deleteConsultant(id);
    if (deleted && selectedConsultantIds.includes(id)) {
      onChange({
        consultantIds: selectedConsultantIds.filter((x) => x !== id),
        consultantProfessions: selectedProfessions,
      });
    }
  };

  return (
    <div className={cn("flex flex-col gap-2 max-w-full overflow-x-hidden", className)} dir="rtl">
      {showHeader && (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <UserCog className="h-4 w-4 text-primary" />
            יועצים (לפי תחום)
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary"
              >
                {activeCount}
              </Badge>
            )}
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[11px] text-muted-foreground"
              onClick={clearAll}
            >
              נקה
            </Button>
          )}
        </div>
      )}

      {showSearch && (
        <div className="relative">
          <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש יועץ / תחום..."
            className="h-7 text-xs pr-7"
          />
        </div>
      )}

      <div className="rounded-md border border-border bg-muted/20 p-2 space-y-2">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
          <Plus className="h-3 w-3" />
          הוספת יועץ
        </div>
        <Input
          value={newConsultantName}
          onChange={(e) => setNewConsultantName(e.target.value)}
          placeholder="שם יועץ חדש"
          className="h-7 text-xs"
        />
        <div className="flex gap-2 min-w-0">
          <Input
            value={newConsultantProfession}
            onChange={(e) => setNewConsultantProfession(e.target.value)}
            placeholder="תחום / סוג"
            className="h-7 text-xs min-w-0"
          />
          <Button
            type="button"
            size="sm"
            className="h-7 shrink-0 gap-1"
            disabled={!newConsultantName.trim()}
            onClick={() => addNewConsultant()}
          >
            <Plus className="h-3.5 w-3.5" />
            הוסף
          </Button>
        </div>
      </div>

      <div className="min-h-[180px] max-h-[min(52vh,360px)] overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
        <div className="space-y-1 max-w-full overflow-x-hidden">
          {grouped.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4">
              לא נמצאו יועצים
            </div>
          )}
          {grouped.map(([prof, list]) => {
            const isExpanded = expanded.has(prof);
            const profActive = selectedProfessions.includes(prof);
            const selectedInGroup = list.filter((c) =>
              selectedConsultantIds.includes(c.id),
            ).length;
            const profCount = clientsCountByProfession?.[prof];
            return (
              <div
                key={prof}
                className={cn(
                  "rounded-md border transition-colors",
                  profActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background",
                )}
              >
                {/* Profession header row */}
                <div className="flex items-center gap-1 px-1.5 py-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleExpand(prof)}
                    className="p-0.5 rounded hover:bg-muted/60 text-muted-foreground"
                    aria-label={isExpanded ? "סגור" : "פתח"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronLeft className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleProfession(prof)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-right py-1 px-1 rounded hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={profActive}
                      className="pointer-events-none"
                    />
                    <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-xs font-semibold flex-1 min-w-0 text-right truncate">
                      {prof}
                    </span>
                    <Badge
                      variant="outline"
                      className="h-4 px-1 text-[9px] font-normal"
                    >
                      {list.length}
                    </Badge>
                    {profCount !== undefined && profCount > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[9px] bg-primary/10 text-primary"
                      >
                        {profCount}
                      </Badge>
                    )}
                    {!profActive && selectedInGroup > 0 && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[9px] bg-accent/40"
                      >
                        {selectedInGroup}
                      </Badge>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewConsultantProfession(prof);
                      setExpanded((prev) => new Set(prev).add(prof));
                    }}
                    title={`הוסף יועץ ל${prof}`}
                    className="p-1 rounded hover:bg-muted/60 text-muted-foreground shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Consultants list (expandable) */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-1 py-1 space-y-0.5 bg-muted/20">
                    {list.map((c) => {
                      const active = selectedConsultantIds.includes(c.id);
                      const cnt = clientsCountByConsultantId?.[c.id];
                      return (
                        <div
                          key={c.id}
                          className={cn(
                            "w-full flex items-center gap-1 px-1 py-0.5 rounded text-xs group",
                            active
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/60",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleConsultant(c.id)}
                            className="flex items-center gap-2 flex-1 min-w-0 text-right px-1 py-1"
                          >
                            <Checkbox
                              checked={active}
                              className="pointer-events-none h-3.5 w-3.5"
                            />
                            <span className="flex-1 truncate text-right">
                              {c.name}
                              {c.company && (
                                <span className="text-[10px] text-muted-foreground mr-1">
                                  · {c.company}
                                </span>
                              )}
                            </span>
                            {cnt !== undefined && cnt > 0 && (
                              <Badge
                                variant="secondary"
                                className="h-4 px-1 text-[9px]"
                              >
                                {cnt}
                              </Badge>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeConsultant(c.id, c.name);
                            }}
                            title="מחק יועץ"
                            className="opacity-60 hover:opacity-100 hover:bg-destructive/10 p-1 rounded text-destructive shrink-0"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssignTarget({
                                id: c.id,
                                name: c.name,
                                profession: c.profession || prof,
                              });
                            }}
                            title="נהל לקוחות משויכים"
                            className="opacity-60 hover:opacity-100 hover:bg-primary/10 p-1 rounded text-primary shrink-0"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {assignTarget && (
        <AssignClientsToConsultantDialog
          open={!!assignTarget}
          onOpenChange={(o) => !o && setAssignTarget(null)}
          consultantId={assignTarget.id}
          consultantName={assignTarget.name}
          consultantProfession={assignTarget.profession}
        />
      )}
    </div>
  );
}
