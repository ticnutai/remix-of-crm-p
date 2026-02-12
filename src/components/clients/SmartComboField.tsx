import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Helper to access the table without TS generated types
const quickOptionsTable = () => supabase.from("field_quick_options" as any);

interface SmartComboFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fieldColumn: string; // column name in clients table to fetch existing values
  dir?: "rtl" | "ltr";
  type?: string;
  className?: string;
}

/**
 * A combo-box input field that shows previously used values from the DB
 * AND user-defined preset options, with manual entry support
 * and a "+" button for quick selection / adding new presets.
 */
const SmartComboField: React.FC<SmartComboFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  fieldColumn,
  dir = "rtl",
  type = "text",
  className,
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dbValues, setDbValues] = useState<string[]>([]);
  const [presetValues, setPresetValues] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newPreset, setNewPreset] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  // Fetch distinct existing values from the clients table column
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchValues = async () => {
      try {
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const { data, error } = await supabase
          .from("clients")
          .select(fieldColumn)
          .not(fieldColumn, "is", null)
          .not(fieldColumn, "eq", "")
          .limit(500)
          .abortSignal(controller.signal);

        clearTimeout(timeoutId);

        if (!error && data && isMounted) {
          const uniqueVals = [
            ...new Set(
              data
                .map((row: any) => row[fieldColumn] as string)
                .filter(Boolean),
            ),
          ].sort((a, b) => a.localeCompare(b));
          setDbValues(uniqueVals);
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error(`Error fetching values for ${fieldColumn}:`, err);
        }
      }
    };

    fetchValues();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [fieldColumn]);

  // Fetch user's preset options for this field
  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;

    const fetchPresets = async () => {
      try {
        const { data, error } = await quickOptionsTable()
          .select("option_value")
          .eq("user_id", user.id)
          .eq("field_name", fieldColumn)
          .order("sort_order", { ascending: true });

        if (!error && data && isMounted) {
          setPresetValues((data as any[]).map((r: any) => r.option_value));
        }
      } catch {
        // silent
      }
    };

    fetchPresets();
    return () => {
      isMounted = false;
    };
  }, [fieldColumn, user?.id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Merge DB values + user presets, deduplicate
  const allValues = useMemo(() => {
    const set = new Set<string>();
    // Presets first (user-defined), then DB values
    for (const v of presetValues) set.add(v);
    for (const v of dbValues) set.add(v);
    return [...set];
  }, [dbValues, presetValues]);

  // Filter based on search/current input
  const filteredValues = useMemo(() => {
    const term = (searchTerm || value || "").toLowerCase().trim();
    if (!term) return allValues;
    return allValues.filter((v) => v.toLowerCase().includes(term));
  }, [allValues, searchTerm, value]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    setSearchTerm(newVal);
    if (!isOpen && newVal) {
      setIsOpen(true);
    }
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setSearchTerm("");
      inputRef.current?.focus();
    }
  };

  // Add a new preset option
  const addPreset = useCallback(async () => {
    const val = newPreset.trim();
    if (!val || !user?.id) return;

    // Already in the list?
    if (allValues.includes(val)) {
      // Just select it
      onChange(val);
      setNewPreset("");
      return;
    }

    try {
      await quickOptionsTable().insert({
        user_id: user.id,
        field_name: fieldColumn,
        option_value: val,
        sort_order: presetValues.length,
      });

      setPresetValues((prev) => [...prev, val]);
      onChange(val);
      setNewPreset("");
    } catch {
      // silent
    }
  }, [newPreset, user?.id, fieldColumn, presetValues, allValues, onChange]);

  // Delete a preset option
  const deletePreset = useCallback(
    async (optVal: string) => {
      if (!user?.id) return;
      try {
        await quickOptionsTable()
          .delete()
          .eq("user_id", user.id)
          .eq("field_name", fieldColumn)
          .eq("option_value", optVal);

        setPresetValues((prev) => prev.filter((v) => v !== optVal));
      } catch {
        // silent
      }
    },
    [user?.id, fieldColumn],
  );

  const isPreset = (val: string) => presetValues.includes(val);

  return (
    <div className={cn("space-y-1", className)} ref={containerRef}>
      <Label className="text-right text-xs">{label}</Label>
      <div className="relative">
        <div className="flex gap-1">
          <Input
            ref={inputRef}
            type={type}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder || label}
            className={cn(
              "text-right flex-1 pr-2",
              dir === "ltr" && "text-left",
            )}
            dir={dir}
            onFocus={() => {
              if (allValues.length > 0) {
                setIsOpen(true);
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-primary/30 hover:bg-primary/10"
            onClick={toggleDropdown}
            title="אפשרויות להזנה מהירה"
          >
            {isOpen ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5 text-primary" />
            )}
          </Button>
        </div>

        {/* Dropdown list */}
        {isOpen && (
          <div className="absolute z-[500] top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-hidden flex flex-col">
            {/* Existing values list */}
            {filteredValues.length > 0 && (
              <div className="overflow-y-auto max-h-36 flex-1">
                {filteredValues.map((val) => (
                  <div
                    key={val}
                    className={cn(
                      "flex items-center justify-between text-sm hover:bg-accent hover:text-accent-foreground transition-colors group",
                      val === value && "bg-accent/50 font-medium",
                    )}
                  >
                    <button
                      type="button"
                      className="flex-1 text-right px-3 py-1.5 truncate"
                      onClick={() => handleSelect(val)}
                    >
                      {val}
                    </button>
                    <div className="flex items-center gap-0.5 pr-1">
                      {val === value && (
                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      )}
                      {isPreset(val) && (
                        <button
                          type="button"
                          className="h-5 w-5 flex items-center justify-center text-muted-foreground/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePreset(val);
                          }}
                          title="הסר מרשימה"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {filteredValues.length === 0 && (
              <div className="px-3 py-2 text-xs text-muted-foreground text-center">
                אין אפשרויות — הוסף חדשה למטה
              </div>
            )}

            {/* Add new preset input */}
            <div className="border-t border-border p-1.5 flex gap-1 bg-muted/30">
              <Input
                ref={addInputRef}
                value={newPreset}
                onChange={(e) => setNewPreset(e.target.value)}
                placeholder="הוסף אפשרות חדשה..."
                className="h-7 text-xs text-right flex-1"
                dir="rtl"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.stopPropagation();
                    addPreset();
                  }
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 hover:bg-green-100 hover:text-green-700"
                onClick={addPreset}
                disabled={!newPreset.trim()}
                title="הוסף"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartComboField;
