// Reusable phone display: shows the primary phone + a small "+N" chip
// when the client has additional_phones. Hover reveals a popover listing
// all the extra numbers with click-to-copy.
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Phone, Copy } from "lucide-react";
import { isValidPhoneForDisplay } from "@/lib/phone-validation";
import { toast } from "sonner";

interface Props {
  phone?: string | null;
  additionalPhones?: string[] | null;
  className?: string;
  fontSize?: number;
  iconSize?: number;
  showIcon?: boolean;
  color?: string;
}

export function PhoneWithExtras({
  phone,
  additionalPhones,
  className,
  fontSize = 12,
  iconSize = 12,
  showIcon = true,
  color,
}: Props) {
  const extras = (additionalPhones || []).filter((p) => isValidPhoneForDisplay(p));
  const hasPrimary = isValidPhoneForDisplay(phone);

  if (!hasPrimary && extras.length === 0) return null;

  const copy = (val: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    navigator.clipboard.writeText(val);
    toast.success("הועתק");
  };

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        color: color ?? "hsl(var(--muted-foreground))",
        direction: "ltr",
      }}
      dir="ltr"
    >
      {showIcon && <Phone style={{ width: iconSize, height: iconSize }} />}
      {hasPrimary && <span style={{ fontSize }}>{phone}</span>}
      {extras.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-full border border-primary/40 bg-primary/10 px-1.5 hover:bg-primary/20 transition-colors"
              style={{
                fontSize: Math.max(9, fontSize - 2),
                lineHeight: 1.4,
                minWidth: 22,
                height: 16,
                color: "hsl(var(--primary))",
                fontWeight: 600,
              }}
              title="מספרים נוספים"
            >
              +{extras.length}
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="w-56 p-2 rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs text-muted-foreground mb-1 px-1">מספרים נוספים</div>
            <ul className="space-y-1">
              {extras.map((num, i) => (
                <li
                  key={`${num}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
                  dir="ltr"
                >
                  <a
                    href={`tel:${num}`}
                    className="text-sm font-mono text-foreground hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {num}
                  </a>
                  <button
                    type="button"
                    onClick={(e) => copy(num, e)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title="העתק"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
