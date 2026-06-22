// Consultants Tree Filter — hierarchical tree view (profession → consultants)
// Clicking the profession name toggles ALL consultants under it.
// Clicking the chevron expands/collapses the list of specific consultants.
// Reusable between Clients page (inside Stages popover) and DataTable Pro (Filter Panel).
import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, UserCog, Briefcase, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useConsultants } from "@/hooks/useConsultants";

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
  const { consultants } = useConsultants();
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  return (
    <div className={cn("flex flex-col gap-2", className)} dir="rtl">
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

      <ScrollArea className="max-h-[260px] pr-1">
        <div className="space-y-1">
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
                <div className="flex items-center gap-1 px-1.5 py-1">
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
                    className="flex items-center gap-2 flex-1 text-right py-1 px-1 rounded hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={profActive}
                      className="pointer-events-none"
                    />
                    <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                    <span className="text-xs font-semibold flex-1 text-right">
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
                </div>

                {/* Consultants list (expandable) */}
                {isExpanded && (
                  <div className="border-t border-border/60 px-1 py-1 space-y-0.5 bg-muted/20">
                    {list.map((c) => {
                      const active = selectedConsultantIds.includes(c.id);
                      const cnt = clientsCountByConsultantId?.[c.id];
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleConsultant(c.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-2 py-1 rounded text-right text-xs",
                            active
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted/60",
                          )}
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
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
