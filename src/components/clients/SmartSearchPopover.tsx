import { useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";

/** Smart search fields — key must match the clients table column name. */
export const SMART_SEARCH_FIELDS = [
  { key: "gush", label: "גוש", aliases: ["גוש", "gush"] },
  { key: "helka", label: "חלקה", aliases: ["חלקה", "helka"] },
  { key: "migrash", label: "מגרש", aliases: ["מגרש", "migrash"] },
  { key: "taba", label: 'תב"ע', aliases: ["תבע", 'תב"ע', "taba"] },
  { key: "id_number", label: "ת.ז / ח.פ", aliases: ["תז", "ת.ז", "id"] },
  { key: "street", label: "רחוב", aliases: ["רחוב", "street"] },
  { key: "moshav", label: "מושב / עיר", aliases: ["מושב", "עיר", "moshav"] },
  { key: "address", label: "כתובת", aliases: ["כתובת", "address"] },
  { key: "company", label: "חברה", aliases: ["חברה", "company"] },
  { key: "phone", label: "טלפון", aliases: ["טלפון", "phone"] },
  { key: "email", label: "אימייל", aliases: ["אימייל", "מייל", "email"] },
] as const;

export type SmartSearchValues = Partial<Record<string, string>>;

interface SmartSearchPopoverProps {
  values: SmartSearchValues;
  onChange: (values: SmartSearchValues) => void;
}

export function SmartSearchPopover({ values, onChange }: SmartSearchPopoverProps) {
  const activeCount = useMemo(
    () => Object.values(values).filter((v) => (v || "").trim() !== "").length,
    [values],
  );

  const setField = (key: string, value: string) =>
    onChange({ ...values, [key]: value });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="relative h-[30px] w-[30px] shrink-0 border-[1.5px] border-amber-500 p-0 text-amber-600 hover:bg-amber-500/10"
          title="חיפוש חכם לפי גוש, חלקה, מגרש, תב&quot;ע ועוד"
          aria-label="חיפוש חכם"
        >
          <SlidersHorizontal className="h-[15px] w-[15px]" />
          {activeCount > 0 && (
            <Badge
              variant="secondary"
              className="absolute -left-1.5 -top-1.5 h-4 min-w-4 justify-center px-1 text-[10px]"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="rtl w-[320px] bg-popover p-3" dir="rtl">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">חיפוש חכם</span>
          {activeCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-muted-foreground"
              onClick={() => onChange({})}
            >
              <X className="h-3 w-3" />
              נקה
            </Button>
          )}
        </div>

        <div className="grid max-h-[320px] grid-cols-2 gap-2 overflow-y-auto pl-1">
          {SMART_SEARCH_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">
                {field.label}
              </Label>
              <Input
                value={values[field.key] || ""}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.label}
                className="h-8 text-right text-xs"
              />
            </div>
          ))}
        </div>

        <p className="mt-3 border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
          טיפ: אפשר לחפש גם ישירות בשורת החיפוש בתחביר{" "}
          <span className="font-mono">גוש:6543 חלקה:12</span>
        </p>
      </PopoverContent>
    </Popover>
  );
}
