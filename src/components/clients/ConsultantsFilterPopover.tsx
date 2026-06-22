// Consultants Filter Popover — filter clients by specific consultants AND by profession
import React, { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  UserCog,
  ChevronDown,
  X,
  Eye,
  Briefcase,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConsultants } from "@/hooks/useConsultants";

interface ConsultantsFilterPopoverProps {
  selectedConsultantIds: string[];
  selectedProfessions: string[];
  onChange: (next: {
    consultantIds: string[];
    consultantProfessions: string[];
  }) => void;
}

export function ConsultantsFilterPopover({
  selectedConsultantIds,
  selectedProfessions,
  onChange,
}: ConsultantsFilterPopoverProps) {
  const { consultants } = useConsultants();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, typeof consultants>();
    for (const c of consultants) {
      if (
        q &&
        !c.name.toLowerCase().includes(q) &&
        !(c.profession || "").toLowerCase().includes(q) &&
        !(c.company || "").toLowerCase().includes(q)
      ) {
        continue;
      }
      const prof = c.profession || "ללא תחום";
      if (!map.has(prof)) map.set(prof, []);
      map.get(prof)!.push(c);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "he"),
    );
  }, [consultants, search]);

  const allProfessions = useMemo(
    () =>
      Array.from(
        new Set(consultants.map((c) => c.profession || "ללא תחום")),
      ).sort((a, b) => a.localeCompare(b, "he")),
    [consultants],
  );

  const activeCount =
    selectedConsultantIds.length + selectedProfessions.length;

  const toggleConsultant = (id: string) => {
    const next = selectedConsultantIds.includes(id)
      ? selectedConsultantIds.filter((x) => x !== id)
      : [...selectedConsultantIds, id];
    onChange({
      consultantIds: next,
      consultantProfessions: selectedProfessions,
    });
  };

  const toggleProfession = (prof: string) => {
    const next = selectedProfessions.includes(prof)
      ? selectedProfessions.filter((x) => x !== prof)
      : [...selectedProfessions, prof];
    onChange({
      consultantIds: selectedConsultantIds,
      consultantProfessions: next,
    });
  };

  const clearAll = () => {
    onChange({ consultantIds: [], consultantProfessions: [] });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 h-7 bg-white text-[#1e293b] border border-[#d4a843] hover:bg-[#fef9ee] hover:text-[#1e293b] text-xs",
            activeCount > 0 &&
              "bg-[#d4a843] text-[#1e293b] border-[#d4a843] hover:bg-[#c49a3a]",
          )}
        >
          <UserCog className="h-4 w-4" />
          יועצים
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="mr-1 bg-accent text-accent-foreground"
            >
              {activeCount}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(94vw,380px)] p-0 overflow-hidden"
        dir="rtl"
        align="end"
        collisionPadding={16}
      >
        <div className="p-3 border-b">
          <div className="flex flex-row-reverse items-center gap-2 mb-2">
            <UserCog className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">סינון לפי יועצים</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-auto"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={clearAll}
              disabled={activeCount === 0}
            >
              <X className="h-3 w-3 ml-1" />
              נקה הכל
            </Button>
            <div className="relative flex-1">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חפש יועץ או תחום..."
                className="h-7 text-xs pr-7"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[65vh]">
          <div className="p-3 space-y-4">
            {/* Section: Filter by profession */}
            <div>
              <div className="flex items-center gap-1 mb-2 text-[11px] font-semibold text-muted-foreground">
                <Briefcase className="h-3 w-3" />
                לפי תחום (סוג יועץ)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allProfessions.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    אין תחומים מוגדרים
                  </div>
                )}
                {allProfessions.map((prof) => {
                  const active = selectedProfessions.includes(prof);
                  return (
                    <button
                      key={prof}
                      onClick={() => toggleProfession(prof)}
                      className={cn(
                        "px-2.5 py-1 rounded-full border text-xs transition-all",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted border-border",
                      )}
                    >
                      {prof}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Specific consultants grouped by profession */}
            <div>
              <div className="flex items-center gap-1 mb-2 text-[11px] font-semibold text-muted-foreground">
                <Eye className="h-3 w-3" />
                יועצים ספציפיים
              </div>
              {grouped.length === 0 && (
                <div className="text-xs text-muted-foreground py-4 text-center">
                  לא נמצאו יועצים
                </div>
              )}
              <div className="space-y-3">
                {grouped.map(([prof, list]) => (
                  <div key={prof}>
                    <div className="text-[10px] font-bold text-primary mb-1 px-1">
                      {prof}
                    </div>
                    <div className="space-y-1">
                      {list.map((c) => {
                        const active = selectedConsultantIds.includes(c.id);
                        return (
                          <div
                            key={c.id}
                            onClick={() => toggleConsultant(c.id)}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all",
                              active
                                ? "bg-primary/10 border-primary"
                                : "bg-muted/30 border-border hover:bg-muted/60",
                            )}
                          >
                            <Checkbox checked={active} />
                            <div className="flex-1 min-w-0 text-right">
                              <div className="text-sm font-medium truncate">
                                {c.name}
                              </div>
                              {c.company && (
                                <div className="text-[10px] text-muted-foreground truncate">
                                  {c.company}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
