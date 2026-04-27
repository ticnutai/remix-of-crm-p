// View Presets Menu - Quick layout switcher for the Clients page
import { useState } from "react";
import {
  LayoutTemplate,
  Grid3x3,
  List,
  Table2,
  Sparkles,
  Save,
  Trash2,
  Check,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUserSettings } from "@/hooks/useUserSettings";
import { toast } from "sonner";

export type ClientsViewMode =
  | "grid"
  | "list"
  | "compact"
  | "cards"
  | "minimal"
  | "portrait"
  | "luxury";

export type ClientsSortBy =
  | "name_asc"
  | "name_desc"
  | "classification_asc"
  | "classification_desc"
  | "created_desc"
  | "created_asc";

export interface ViewPresetState {
  viewMode: ClientsViewMode;
  minimalColumns: 2 | 3;
  sortBy: ClientsSortBy;
  showStagesView: boolean;
  showStatisticsView: boolean;
}

export interface SavedPreset extends ViewPresetState {
  id: string;
  name: string;
}

interface BuiltInPreset {
  id: string;
  name: string;
  description: string;
  icon: typeof LayoutTemplate;
  state: ViewPresetState;
}

const BUILT_IN_PRESETS: BuiltInPreset[] = [
  {
    id: "classic",
    name: "קלאסי",
    description: "כרטיסים מסודרים בגריד",
    icon: Grid3x3,
    state: {
      viewMode: "grid",
      minimalColumns: 3,
      sortBy: "name_asc",
      showStagesView: false,
      showStatisticsView: false,
    },
  },
  {
    id: "compact",
    name: "קומפקטי",
    description: "מינימלי וצפוף — יותר לקוחות במסך",
    icon: List,
    state: {
      viewMode: "minimal",
      minimalColumns: 3,
      sortBy: "name_asc",
      showStagesView: false,
      showStatisticsView: false,
    },
  },
  {
    id: "luxury",
    name: "יוקרתי",
    description: "כרטיסים גדולים בעיצוב מהודר",
    icon: Sparkles,
    state: {
      viewMode: "luxury",
      minimalColumns: 2,
      sortBy: "name_asc",
      showStagesView: false,
      showStatisticsView: false,
    },
  },
  {
    id: "stages",
    name: "תצוגת שלבים",
    description: "ארגון לקוחות לפי שלבי פרויקט",
    icon: Table2,
    state: {
      viewMode: "grid",
      minimalColumns: 3,
      sortBy: "name_asc",
      showStagesView: true,
      showStatisticsView: false,
    },
  },
];

interface Props {
  current: ViewPresetState;
  onApply: (state: ViewPresetState) => void;
}

export function ViewPresetsMenu({ current, onApply }: Props) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  // Cloud-persisted custom presets
  const { value: customPresets, setValue: saveCustomPresets } = useUserSettings<
    SavedPreset[]
  >({
    key: "clients_view_presets",
    defaultValue: [],
  });

  const isPresetActive = (state: ViewPresetState) => {
    return (
      current.viewMode === state.viewMode &&
      current.minimalColumns === state.minimalColumns &&
      current.showStagesView === state.showStagesView &&
      current.showStatisticsView === state.showStatisticsView
    );
  };

  const handleApply = (state: ViewPresetState, name: string) => {
    onApply(state);
    toast.success(`הוחל: ${name}`, { duration: 1500 });
  };

  const handleSavePreset = () => {
    const name = presetName.trim();
    if (!name) {
      toast.error("יש לתת שם לתצוגה");
      return;
    }
    const newPreset: SavedPreset = {
      ...current,
      id: `custom-${Date.now()}`,
      name,
    };
    saveCustomPresets([...(customPresets || []), newPreset]);
    toast.success(`התצוגה "${name}" נשמרה`);
    setPresetName("");
    setSaveDialogOpen(false);
  };

  const handleDeletePreset = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    saveCustomPresets((customPresets || []).filter((p) => p.id !== id));
    toast.success("התצוגה נמחקה");
  };

  // Style matching the other icon buttons in Clients header
  const triggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid #d4a843",
    background: "transparent",
    color: "#d4a843",
    cursor: "pointer",
    transition: "all 0.2s ease",
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            style={triggerStyle}
            title="תצוגות מוכנות / שינוי פריסה"
            aria-label="תצוגות מוכנות"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#fef9e7";
              e.currentTarget.style.color = "#1e293b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#d4a843";
            }}
          >
            <LayoutTemplate style={{ width: "16px", height: "16px" }} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64" dir="rtl">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            תצוגות מוכנות
          </DropdownMenuLabel>

          {BUILT_IN_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const active = isPresetActive(preset.state);
            return (
              <DropdownMenuItem
                key={preset.id}
                onSelect={() => handleApply(preset.state, preset.name)}
                className="flex items-start gap-2 py-2 cursor-pointer"
              >
                <Icon
                  className="h-4 w-4 mt-0.5 shrink-0"
                  style={{ color: "#d4a843" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{preset.name}</span>
                    {active && (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {preset.description}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}

          {customPresets && customPresets.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                התצוגות שלי
              </DropdownMenuLabel>
              {customPresets.map((preset) => {
                const active = isPresetActive(preset);
                return (
                  <DropdownMenuItem
                    key={preset.id}
                    onSelect={() => handleApply(preset, preset.name)}
                    className="flex items-center gap-2 py-2 cursor-pointer group"
                  >
                    <Sparkles
                      className="h-4 w-4 shrink-0"
                      style={{ color: "#d4a843" }}
                    />
                    <div className="flex-1 min-w-0 flex items-center gap-1.5">
                      <span className="text-sm truncate">{preset.name}</span>
                      {active && (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      )}
                    </div>
                    <button
                      onClick={(e) => handleDeletePreset(preset.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
                      title="מחק תצוגה"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setSaveDialogOpen(true)}
            className="flex items-center gap-2 py-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" style={{ color: "#d4a843" }} />
            <span className="text-sm">שמור תצוגה נוכחית</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save preset dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent
          dir="rtl"
          className="sm:max-w-[420px]"
          style={{ border: "2px solid #d4a843" }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Save className="h-5 w-5" style={{ color: "#d4a843" }} />
              שמירת תצוגה אישית
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              התצוגה הנוכחית (פריסה, מיון ופילטרים) תישמר תחת השם הבא:
            </p>
            <Input
              autoFocus
              dir="rtl"
              placeholder="לדוגמה: תצוגת בוקר, לקוחות פעילים..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSavePreset();
              }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSavePreset}
              style={{ background: "#d4a843", color: "white" }}
            >
              שמור
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
