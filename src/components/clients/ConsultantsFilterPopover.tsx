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
  Plus,
  Trash2,
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
  const { consultants, addConsultant, deleteConsultant } = useConsultants();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [newConsultantName, setNewConsultantName] = useState("");
  const [newConsultantProfession, setNewConsultantProfession] = useState("");

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 h-7 bg-background text-foreground border border-primary/50 hover:bg-accent hover:text-accent-foreground text-xs",
            activeCount > 0 &&
              "bg-primary text-primary-foreground border-primary hover:bg-primary/90",
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
        className="w-[min(94vw,380px)] max-w-[94vw] p-0 overflow-hidden flex flex-col"
        align="end"
        collisionPadding={16}
        style={{ height: "min(80vh, var(--radix-popper-available-height, 80vh))" }}
      >
        <div className="p-3 border-b shrink-0">
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

        <ScrollArea className="flex-1 min-h-0 overflow-x-hidden">
          <div className="p-3 space-y-4 max-w-full overflow-x-hidden">
            <div className="rounded-md border border-border bg-muted/20 p-2 space-y-2">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                <Plus className="h-3 w-3" />
                הוספת יועץ לרשימה
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Input
                  value={newConsultantName}
                  onChange={(e) => setNewConsultantName(e.target.value)}
                  placeholder="שם יועץ חדש"
                  className="h-8 text-xs"
                />
                <div className="flex gap-2 min-w-0">
                  <Input
                    value={newConsultantProfession}
                    onChange={(e) => setNewConsultantProfession(e.target.value)}
                    placeholder="תחום / סוג יועץ"
                    className="h-8 text-xs min-w-0"
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 shrink-0 gap-1"
                    disabled={!newConsultantName.trim()}
                    onClick={() => addNewConsultant()}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    הוסף
                  </Button>
                </div>
              </div>
            </div>

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
                    <span key={prof} className="inline-flex items-center gap-1 max-w-full">
                      <button
                        type="button"
                        onClick={() => toggleProfession(prof)}
                        className={cn(
                          "max-w-full px-2.5 py-1 rounded-full border text-xs transition-all truncate",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-border",
                        )}
                      >
                        {prof}
                      </button>
                      <button
                        type="button"
                        className="rounded-full border border-border bg-background p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title={`הוסף יועץ ל${prof}`}
                        onClick={() => setNewConsultantProfession(prof)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </span>
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
                              "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-all min-w-0",
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
                            <button
                              type="button"
                              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                              title="מחק יועץ"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeConsultant(c.id, c.name);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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
