// AdvancedSearchPanel - Expandable advanced search for Gmail
// Enhanced: body/words search, client/contact picker for From/To fields
import React, { useState, useCallback, useEffect, useMemo, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Paperclip,
  Filter,
  Users,
  UserPlus,
  Mail,
  Phone,
  Building2,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ── Types ──────────────────────────────────────────────────────
interface AdvancedSearchPanelProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
}

interface SearchFilters {
  from: string;
  to: string;
  subject: string;
  bodyWords: string;
  hasAttachments: boolean;
  dateAfter: string;
  dateBefore: string;
  label: string;
  isUnread: boolean;
  isStarred: boolean;
  excludeWords: string;
}

interface ContactInfo {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  type: "client" | "contact";
}

const EMPTY_FILTERS: SearchFilters = {
  from: "",
  to: "",
  subject: "",
  bodyWords: "",
  hasAttachments: false,
  dateAfter: "",
  dateBefore: "",
  label: "",
  isUnread: false,
  isStarred: false,
  excludeWords: "",
};

// ── Contact/Client Picker Popover ──────────────────────────────
const ContactPickerPopover = memo(function ContactPickerPopover({
  onSelect,
  trigger,
}: {
  onSelect: (email: string) => void;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState<ContactInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Load clients + contacts when popover opens
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        // Fetch clients
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name, email, phone, company")
          .order("name")
          .limit(500);

        // Fetch client contacts (people linked to clients)
        const { data: contactsData } = await supabase
          .from("client_contacts")
          .select("id, name, email, phone")
          .order("name")
          .limit(500);

        if (cancelled) return;

        const result: ContactInfo[] = [];
        (clients || []).forEach((c) => {
          if (c.email) {
            result.push({
              id: c.id,
              name: c.name || "",
              email: c.email,
              phone: c.phone,
              company: c.company,
              type: "client",
            });
          }
        });
        (contactsData || []).forEach((c) => {
          if (c.email) {
            result.push({
              id: c.id,
              name: c.name || "",
              email: c.email,
              phone: c.phone,
              company: null,
              type: "contact",
            });
          }
        });
        setContacts(result);
      } catch (err) {
        console.error("Error loading contacts for search:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, user]);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.company?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [contacts, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-72 p-0"
        align="start"
        side="bottom"
        dir="rtl"
      >
        <div className="p-2 border-b">
          <Input
            placeholder="חפש לקוח או איש קשר..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>
        <ScrollArea className="max-h-60">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              טוען...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {search ? "לא נמצאו תוצאות" : "אין לקוחות/אנשי קשר עם אימייל"}
            </div>
          ) : (
            <div className="p-1">
              {filtered.map((c) => (
                <button
                  key={`${c.type}-${c.id}`}
                  className="w-full text-right px-3 py-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2 group"
                  onClick={() => {
                    if (c.email) {
                      onSelect(c.email);
                      setOpen(false);
                      setSearch("");
                    }
                  }}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs ${
                      c.type === "client" ? "bg-blue-500" : "bg-emerald-500"
                    }`}
                  >
                    {c.type === "client" ? (
                      <Building2 className="h-3.5 w-3.5" />
                    ) : (
                      <Users className="h-3.5 w-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {c.name}
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 flex-shrink-0"
                      >
                        {c.type === "client" ? "לקוח" : "איש קשר"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      {c.email}
                    </div>
                    {c.company && (
                      <div className="text-[10px] text-muted-foreground/70 truncate">
                        {c.company}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/30">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 bg-blue-500/10 border-blue-300"
            >
              <Building2 className="h-2.5 w-2.5 ml-0.5" /> לקוח
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 bg-emerald-500/10 border-emerald-300"
            >
              <Users className="h-2.5 w-2.5 ml-0.5" /> איש קשר
            </Badge>
            <span className="mr-auto">{filtered.length} תוצאות</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

// ── Main Advanced Search Panel ──────────────────────────────────
export const AdvancedSearchPanel = memo(function AdvancedSearchPanel({
  onSearch,
  onClear,
  isSearching,
}: AdvancedSearchPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const updateFilter = useCallback(
    <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const buildGmailQuery = useCallback((f: SearchFilters): string => {
    const parts: string[] = [];

    if (f.from.trim()) parts.push(`from:${f.from.trim()}`);
    if (f.to.trim()) parts.push(`to:${f.to.trim()}`);
    if (f.subject.trim()) parts.push(`subject:${f.subject.trim()}`);
    // Body/words search: Gmail treats bare words as body+subject search
    if (f.bodyWords.trim()) {
      // Wrap each word/phrase for proper Gmail query
      const words = f.bodyWords.trim();
      // If it has spaces, wrap in quotes for exact phrase, otherwise bare word
      if (words.includes(" ")) {
        parts.push(`"${words}"`);
      } else {
        parts.push(words);
      }
    }
    if (f.hasAttachments) parts.push("has:attachment");
    if (f.dateAfter) {
      const d = new Date(f.dateAfter);
      parts.push(`after:${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`);
    }
    if (f.dateBefore) {
      const d = new Date(f.dateBefore);
      parts.push(
        `before:${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`,
      );
    }
    if (f.label.trim()) parts.push(`label:${f.label.trim()}`);
    if (f.isUnread) parts.push("is:unread");
    if (f.isStarred) parts.push("is:starred");
    if (f.excludeWords.trim()) {
      const words = f.excludeWords.trim().split(/\s+/);
      words.forEach((w) => parts.push(`-${w}`));
    }

    return parts.join(" ");
  }, []);

  const countActiveFilters = useCallback((f: SearchFilters): number => {
    let count = 0;
    if (f.from.trim()) count++;
    if (f.to.trim()) count++;
    if (f.subject.trim()) count++;
    if (f.bodyWords.trim()) count++;
    if (f.hasAttachments) count++;
    if (f.dateAfter) count++;
    if (f.dateBefore) count++;
    if (f.label.trim()) count++;
    if (f.isUnread) count++;
    if (f.isStarred) count++;
    if (f.excludeWords.trim()) count++;
    return count;
  }, []);

  const handleSearch = useCallback(() => {
    const query = buildGmailQuery(filters);
    if (query) {
      setActiveFilterCount(countActiveFilters(filters));
      onSearch(query);
    }
  }, [filters, buildGmailQuery, countActiveFilters, onSearch]);

  const handleClear = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setActiveFilterCount(0);
    onClear();
  }, [onClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Filter className="h-4 w-4" />
          חיפוש מתקדם
          {isOpen ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
          {activeFilterCount > 0 && !isOpen && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -left-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3">
        <div
          className="border rounded-lg p-4 bg-card space-y-4"
          dir="rtl"
          onKeyDown={handleKeyDown}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* From - with client/contact picker */}
            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Mail className="h-3 w-3" />
                מאת
              </Label>
              <div className="flex gap-1">
                <Input
                  placeholder="כתובת שולח..."
                  value={filters.from}
                  onChange={(e) => updateFilter("from", e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <ContactPickerPopover
                  onSelect={(email) => updateFilter("from", email)}
                  trigger={
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      title="בחר לקוח או איש קשר"
                      type="button"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </div>

            {/* To - with client/contact picker */}
            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Mail className="h-3 w-3" />
                אל
              </Label>
              <div className="flex gap-1">
                <Input
                  placeholder="כתובת נמען..."
                  value={filters.to}
                  onChange={(e) => updateFilter("to", e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <ContactPickerPopover
                  onSelect={(email) => updateFilter("to", email)}
                  trigger={
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      title="בחר לקוח או איש קשר"
                      type="button"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">נושא</Label>
              <Input
                placeholder="נושא ההודעה..."
                value={filters.subject}
                onChange={(e) => updateFilter("subject", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Body Words - NEW */}
            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1">
                <FileText className="h-3 w-3" />
                מילים בתוכן
              </Label>
              <Input
                placeholder="מילים שמופיעות בגוף המייל..."
                value={filters.bodyWords}
                onChange={(e) => updateFilter("bodyWords", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Date After */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">מתאריך</Label>
              <Input
                type="date"
                value={filters.dateAfter}
                onChange={(e) => updateFilter("dateAfter", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Date Before */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">עד תאריך</Label>
              <Input
                type="date"
                value={filters.dateBefore}
                onChange={(e) => updateFilter("dateBefore", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* Exclude Words */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">ללא המילים</Label>
              <Input
                placeholder="מילים לסינון..."
                value={filters.excludeWords}
                onChange={(e) => updateFilter("excludeWords", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Checkboxes row */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-attachments"
                checked={filters.hasAttachments}
                onCheckedChange={(checked) =>
                  updateFilter("hasAttachments", !!checked)
                }
              />
              <label
                htmlFor="has-attachments"
                className="text-sm flex items-center gap-1 cursor-pointer"
              >
                <Paperclip className="h-3.5 w-3.5" />
                עם קבצים מצורפים
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-unread"
                checked={filters.isUnread}
                onCheckedChange={(checked) =>
                  updateFilter("isUnread", !!checked)
                }
              />
              <label htmlFor="is-unread" className="text-sm cursor-pointer">
                לא נקראו בלבד
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-starred"
                checked={filters.isStarred}
                onCheckedChange={(checked) =>
                  updateFilter("isStarred", !!checked)
                }
              />
              <label htmlFor="is-starred" className="text-sm cursor-pointer">
                מסומנים בכוכב
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={isSearching}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              חפש
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              נקה
            </Button>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} פילטרים פעילים
              </Badge>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
