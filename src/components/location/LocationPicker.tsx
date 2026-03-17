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
    if (open) fetchSavedLocations();
  }, [open, fetchSavedLocations]);

  // Build options list
  const options = useMemo(() => {
    const all: LocationOption[] = [];

    // Client addresses
    clientAddresses.forEach((a) => all.push(a));

    // Favorites
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

    // Recent from saved
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

    // Recent from meetings (dedup against saved)
    const savedNames = new Set(savedLocations.map((s) => s.name?.toLowerCase()));
    recentLocations.forEach((r) => {
      if (!savedNames.has(r.label.toLowerCase())) {
        all.push(r);
      }
    });

    // Filter by search
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
    // Track usage
    trackUsage(loc);
  };

  const trackUsage = async (loc: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if location already saved
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

  const addCustomLocation = async () => {
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
        return "מועדפים";
      case "recent":
        return "אחרונים";
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
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        {/* Search input */}
        <div className="flex items-center gap-2 p-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חפש או הקלד מיקום חדש..."
            className="h-8 border-0 shadow-none focus-visible:ring-0 text-right text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && search.trim()) {
                addCustomLocation();
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
        </div>

        <ScrollArea className="max-h-[280px]">
          <div className="p-1">
            {/* Free text option when typing */}
            {search.trim() && (
              <button
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-right hover:bg-accent transition-colors"
                onClick={addCustomLocation}
              >
                <Plus className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate flex-1 text-right">
                  הוסף: &quot;{search.trim()}&quot;
                </span>
              </button>
            )}

            {/* Grouped options */}
            {groupedOptions.map((group) => (
              <div key={group.type}>
                <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  {getGroupLabel(group.type)}
                </div>
                {group.items.map((option, idx) => (
                  <button
                    key={`${group.type}-${idx}`}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-right hover:bg-accent transition-colors",
                      value === option.label && "bg-accent",
                    )}
                    onClick={() => selectLocation(option.label)}
                  >
                    {getIcon(option.type)}
                    <div className="flex-1 text-right min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="block text-xs text-muted-foreground truncate">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                    {/* Favorite toggle */}
                    <button
                      className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                      onClick={(e) => toggleFavorite(e, option)}
                      title={option.isFavorite ? "הסר ממועדפים" : "הצמד למועדפים"}
                    >
                      {option.isFavorite ? (
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <StarOff className="h-3.5 w-3.5 text-muted-foreground hover:text-yellow-400" />
                      )}
                    </button>
                  </button>
                ))}
              </div>
            ))}

            {/* Empty state */}
            {groupedOptions.length === 0 && !search.trim() && (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p>אין מיקומים שמורים</p>
                <p className="text-xs">הקלד כדי להוסיף מיקום חדש</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Clear button if value set */}
        {value && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              <X className="h-3 w-3 ml-1" />
              נקה מיקום
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default LocationPicker;
