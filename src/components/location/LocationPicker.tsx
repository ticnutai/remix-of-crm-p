// LocationPicker - Reusable location picker with suggestions, favorites, and free text
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Plus,
  Star,
  StarOff,
  Clock,
  Building,
  Search,
  X,
  Pencil,
  Trash2,
  Check,
} from "lucide-react";

interface LocationOption {
  id?: string;
  label: string;
  sublabel?: string;
  type: "client" | "favorite" | "recent" | "custom";
  isFavorite?: boolean;
}

interface LocationPickerProps {
  value: string;
  onChange: (value: string) => void;
  clientIds?: string[];
  placeholder?: string;
  className?: string;
  inputStyle?: React.CSSProperties;
  iconColor?: string;
}

export function LocationPicker({
  value,
  onChange,
  clientIds = [],
  placeholder = "בחר או הקלד מיקום",
  className,
  inputStyle,
  iconColor,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [clientAddresses, setClientAddresses] = useState<LocationOption[]>([]);
  const [recentLocations, setRecentLocations] = useState<LocationOption[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddInput, setShowAddInput] = useState(false);
  const [newLocationValue, setNewLocationValue] = useState("");

  // Fetch saved locations
  const fetchSavedLocations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("saved_locations")
      .select("*")
      .eq("user_id", user.id)
      .order("is_favorite", { ascending: false })
      .order("use_count", { ascending: false })
      .limit(50);

    if (data) setSavedLocations(data);
  }, []);

  // Fetch client addresses when clientIds change
  useEffect(() => {
    async function fetchClientAddresses() {
      if (clientIds.length === 0) {
        setClientAddresses([]);
        return;
      }
      const { data } = await supabase
        .from("clients")
        .select("id, name, address")
        .in("id", clientIds);

      if (data) {
        const addresses = data
          .filter((c: any) => c.address)
          .map((c: any) => ({
            label: c.address,
            sublabel: c.name,
            type: "client" as const,
          }));
        setClientAddresses(addresses);
      }
    }
    fetchClientAddresses();
  }, [clientIds]);

  // Fetch recent meeting locations
  useEffect(() => {
    async function fetchRecentLocations() {
      const { data } = await supabase
        .from("meetings")
        .select("location")
        .not("location", "is", null)
        .not("location", "eq", "")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data) {
        const unique = new Map<string, boolean>();
        const recent: LocationOption[] = [];
        data.forEach((m: any) => {
          const loc = m.location?.trim();
          if (loc && !unique.has(loc.toLowerCase())) {
            unique.set(loc.toLowerCase(), true);
            recent.push({ label: loc, type: "recent" });
          }
        });
        setRecentLocations(recent.slice(0, 10));
      }
    }
    fetchRecentLocations();
  }, []);

  useEffect(() => {
    if (open) {
      fetchSavedLocations();
      setShowAddInput(false);
      setEditingId(null);
    }
  }, [open, fetchSavedLocations]);

  // Build options list
  const options = useMemo(() => {
    const all: LocationOption[] = [];

    clientAddresses.forEach((a) => all.push(a));

    savedLocations
      .filter((s) => s.is_favorite)
      .forEach((s) =>
        all.push({
          id: s.id,
          label: s.name,
          sublabel: s.address || undefined,
          type: "favorite",
          isFavorite: true,
        }),
      );

    savedLocations
      .filter((s) => !s.is_favorite)
      .forEach((s) =>
        all.push({
          id: s.id,
          label: s.name,
          sublabel: s.address || undefined,
          type: "recent",
          isFavorite: false,
        }),
      );

    const savedNames = new Set(savedLocations.map((s) => s.name?.toLowerCase()));
    recentLocations.forEach((r) => {
      if (!savedNames.has(r.label.toLowerCase())) {
        all.push(r);
      }
    });

    if (search.trim()) {
      const q = search.toLowerCase();
      return all.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(q)),
      );
    }

    return all;
  }, [clientAddresses, savedLocations, recentLocations, search]);

  const selectLocation = (loc: string) => {
    onChange(loc);
    setOpen(false);
    setSearch("");
    trackUsage(loc);
  };

  const trackUsage = async (loc: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from("saved_locations")
      .select("id, use_count")
      .eq("user_id", user.id)
      .eq("name", loc)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("saved_locations")
        .update({
          use_count: (existing.use_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("saved_locations").insert({
        user_id: user.id,
        name: loc,
        use_count: 1,
        last_used_at: new Date().toISOString(),
      });
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, option: LocationOption) => {
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (option.id) {
      await supabase
        .from("saved_locations")
        .update({ is_favorite: !option.isFavorite })
        .eq("id", option.id);
    } else {
      await supabase.from("saved_locations").insert({
        user_id: user.id,
        name: option.label,
        address: option.sublabel || null,
        is_favorite: true,
        use_count: 0,
      });
    }
    fetchSavedLocations();
  };

  const deleteLocation = async (e: React.MouseEvent, option: LocationOption) => {
    e.stopPropagation();
    if (!option.id) return;
    await supabase.from("saved_locations").delete().eq("id", option.id);
    fetchSavedLocations();
  };

  const startEdit = (e: React.MouseEvent, option: LocationOption) => {
    e.stopPropagation();
    if (!option.id) return;
    setEditingId(option.id);
    setEditValue(option.label);
  };

  const saveEdit = async (e: React.MouseEvent, option: LocationOption) => {
    e.stopPropagation();
    if (!option.id || !editValue.trim()) return;
    await supabase
      .from("saved_locations")
      .update({ name: editValue.trim() })
      .eq("id", option.id);
    setEditingId(null);
    setEditValue("");
    fetchSavedLocations();
  };

  const addNewLocation = async () => {
    if (!newLocationValue.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("saved_locations").insert({
      user_id: user.id,
      name: newLocationValue.trim(),
      is_favorite: false,
      use_count: 0,
    });
    setNewLocationValue("");
    setShowAddInput(false);
    fetchSavedLocations();
  };

  const addCustomFromSearch = () => {
    if (!search.trim()) return;
    selectLocation(search.trim());
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "client":
        return <Building className="h-3.5 w-3.5 text-blue-400 shrink-0" />;
      case "favorite":
        return <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400 shrink-0" />;
      case "recent":
        return <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
      default:
        return <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
    }
  };

  const getGroupLabel = (type: string) => {
    switch (type) {
      case "client":
        return "כתובות לקוח";
      case "favorite":
        return "⭐ מועדפים";
      case "recent":
        return "🕐 אחרונים";
      default:
        return "";
    }
  };

  // Group options by type
  const groupedOptions = useMemo(() => {
    const groups: { type: string; items: LocationOption[] }[] = [];
    const typeOrder = ["client", "favorite", "recent", "custom"];

    typeOrder.forEach((type) => {
      const items = options.filter((o) => o.type === type);
      if (items.length > 0) {
        groups.push({ type, items });
      }
    });

    return groups;
  }, [options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative cursor-pointer", className)}>
          <MapPin
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4"
            style={{ color: iconColor }}
          />
          <Input
            value={value}
            readOnly
            placeholder={placeholder}
            className="text-right pr-10 cursor-pointer"
            style={inputStyle}
            onClick={() => setOpen(true)}
          />
          {/* Clear button on the input */}
          {value && (
            <button
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              title="נקה מיקום"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[340px] p-0 rounded-lg shadow-lg"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        {/* Header with search and add button */}
        <div className="flex items-center gap-2 p-2.5 border-b bg-muted/30">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש מיקום..."
            className="h-7 border-0 shadow-none focus-visible:ring-0 text-right text-sm bg-transparent"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                addCustomFromSearch();
              }
            }}
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setSearch("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {/* Add new location button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-primary hover:text-primary hover:bg-primary/10 rounded-full"
            onClick={() => {
              setShowAddInput(!showAddInput);
              setNewLocationValue(search);
            }}
            title="הוסף מיקום חדש"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Add new location input */}
        {showAddInput && (
          <div className="flex items-center gap-2 p-2.5 border-b bg-primary/5">
            <Plus className="h-4 w-4 text-primary shrink-0" />
            <Input
              value={newLocationValue}
              onChange={(e) => setNewLocationValue(e.target.value)}
              placeholder="הקלד שם מיקום חדש..."
              className="h-7 border-0 shadow-none focus-visible:ring-0 text-right text-sm bg-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") addNewLocation();
                if (e.key === "Escape") setShowAddInput(false);
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-green-600 hover:text-green-700 hover:bg-green-100"
              onClick={addNewLocation}
              disabled={!newLocationValue.trim()}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setShowAddInput(false)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Free text option when searching */}
        {search.trim() && (
          <button
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-right hover:bg-accent transition-colors border-b"
            onClick={addCustomFromSearch}
          >
            <Plus className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate flex-1 text-right font-medium">
              השתמש: &quot;{search.trim()}&quot;
            </span>
          </button>
        )}

        <ScrollArea className="max-h-[260px]">
          <div className="py-1">
            {/* Grouped options */}
            {groupedOptions.map((group) => (
              <div key={group.type}>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                  {getGroupLabel(group.type)}
                </div>
                {group.items.map((option, idx) => (
                  <div
                    key={`${group.type}-${idx}`}
                    className={cn(
                      "group flex items-center gap-2 w-full px-3 py-2 text-sm text-right hover:bg-accent/60 transition-colors cursor-pointer border-b border-border/20 last:border-b-0",
                      value === option.label && "bg-accent",
                    )}
                    onClick={() => {
                      if (editingId !== option.id) selectLocation(option.label);
                    }}
                  >
                    {getIcon(option.type)}

                    {/* Content - editable or display */}
                    {editingId === option.id ? (
                      <div className="flex-1 flex items-center gap-1 min-w-0">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-6 text-xs text-right border-primary/30"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit(e as any, option);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0 text-green-600"
                          onClick={(e) => saveEdit(e, option)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex-1 text-right min-w-0">
                        <span className="block truncate text-sm">{option.label}</span>
                        {option.sublabel && (
                          <span className="block text-[11px] text-muted-foreground truncate">
                            {option.sublabel}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons - visible on hover */}
                    {editingId !== option.id && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {/* Favorite toggle */}
                        <button
                          className="p-1 rounded hover:bg-muted transition-colors"
                          onClick={(e) => toggleFavorite(e, option)}
                          title={option.isFavorite ? "הסר ממועדפים" : "הצמד למועדפים"}
                        >
                          {option.isFavorite ? (
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          ) : (
                            <StarOff className="h-3 w-3 text-muted-foreground hover:text-yellow-400" />
                          )}
                        </button>

                        {/* Edit button - only for saved locations */}
                        {option.id && (
                          <button
                            className="p-1 rounded hover:bg-muted transition-colors"
                            onClick={(e) => startEdit(e, option)}
                            title="ערוך מיקום"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </button>
                        )}

                        {/* Delete button - only for saved locations */}
                        {option.id && (
                          <button
                            className="p-1 rounded hover:bg-destructive/10 transition-colors"
                            onClick={(e) => deleteLocation(e, option)}
                            title="מחק מיקום"
                          >
                            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Empty state */}
            {groupedOptions.length === 0 && !search.trim() && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-medium">אין מיקומים שמורים</p>
                <p className="text-xs mt-1">לחץ על + כדי להוסיף מיקום חדש</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default LocationPicker;
