// AdvancedSearchPanel - Expandable advanced search for Gmail
import React, { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Paperclip,
  Filter,
} from "lucide-react";

interface AdvancedSearchPanelProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isSearching: boolean;
}

interface SearchFilters {
  from: string;
  to: string;
  subject: string;
  hasAttachments: boolean;
  dateAfter: string;
  dateBefore: string;
  label: string;
  isUnread: boolean;
  isStarred: boolean;
  excludeWords: string;
}

const EMPTY_FILTERS: SearchFilters = {
  from: "",
  to: "",
  subject: "",
  hasAttachments: false,
  dateAfter: "",
  dateBefore: "",
  label: "",
  isUnread: false,
  isStarred: false,
  excludeWords: "",
};

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
    if (f.hasAttachments) parts.push("has:attachment");
    if (f.dateAfter) {
      const d = new Date(f.dateAfter);
      parts.push(
        `after:${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`,
      );
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
        <Button
          variant="outline"
          size="sm"
          className="gap-2 relative"
        >
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
            {/* From */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">מאת</Label>
              <Input
                placeholder="כתובת שולח..."
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            {/* To */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">אל</Label>
              <Input
                placeholder="כתובת נמען..."
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
                className="h-8 text-sm"
              />
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
              <label htmlFor="has-attachments" className="text-sm flex items-center gap-1 cursor-pointer">
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
