// AssigneePicker - choose a team member (admin sees all; others restricted)
import React, { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Search, User as UserIcon, X } from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SingleProps {
  multi?: false;
  value: string | null;
  onChange: (value: string | null) => void;
}
interface MultiProps {
  multi: true;
  value: string[];
  onChange: (value: string[]) => void;
}

type Props = (SingleProps | MultiProps) & {
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

export function AssigneePicker(props: Props) {
  const { label, placeholder = "בחר עובד", className, disabled, allowClear = true } = props;
  const { user } = useAuth();
  const { isAdmin } = usePermissions();
  const { members } = useTeamMembers();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const visibleMembers = useMemo(() => {
    const list = isAdmin ? members : members.filter(m => m.id === user?.id);
    if (!search.trim()) return list;
    const s = search.toLowerCase();
    return list.filter(
      m => (m.full_name || "").toLowerCase().includes(s) || (m.email || "").toLowerCase().includes(s),
    );
  }, [members, isAdmin, user?.id, search]);

  const selectedIds: string[] = props.multi
    ? (props.value as string[])
    : props.value
      ? [props.value as string]
      : [];
  const selectedMembers = members.filter(m => selectedIds.includes(m.id));

  const toggle = (id: string) => {
    if (props.multi) {
      const cur = props.value as string[];
      const next = cur.includes(id) ? cur.filter(v => v !== id) : [...cur, id];
      (props.onChange as (v: string[]) => void)(next);
    } else {
      const cur = props.value as string | null;
      (props.onChange as (v: string | null) => void)(cur === id ? null : id);
      setOpen(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium" style={{ color: "#d8ac27" }}>
          {label}
        </label>
      )}
      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedMembers.map(m => (
            <span
              key={m.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: "#d8ac2720", border: "1px solid #d8ac2750", color: "#d8ac27" }}
            >
              <UserIcon className="h-3 w-3" />
              {m.full_name || m.email || "ללא שם"}
              {allowClear && !disabled && (
                <button
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="p-0.5 rounded-full hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="w-full justify-between gap-2"
            style={{ background: "#FFFFFF", borderColor: "#d8ac27", color: "#0F1F3D" }}
          >
            <span className="truncate">
              {selectedMembers.length > 0
                ? props.multi
                  ? `${selectedMembers.length} נבחרו — הוסף עוד`
                  : selectedMembers[0].full_name || selectedMembers[0].email
                : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] p-0 overflow-hidden rtl"
          align="start"
          style={{ background: "#162C58", border: "1px solid #d8ac2740" }}
        >
          <div className="p-2 border-b" style={{ borderColor: "#d8ac2730" }}>
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4" style={{ color: "#d8ac2790" }} />
              <Input
                placeholder="חיפוש עובד..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-9 text-right text-sm"
                style={{ background: "#FFFFFF", borderColor: "#d8ac27", color: "#0F1F3D" }}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1 gold-scrollbar">
            {visibleMembers.length === 0 && (
              <div className="px-3 py-4 text-center text-xs" style={{ color: "#d8ac27aa" }}>
                לא נמצאו עובדים
              </div>
            )}
            {visibleMembers.map(m => {
              const selected = selectedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-sm text-right hover:bg-white/5 transition-colors"
                  style={{ color: "#FFFFFF" }}
                >
                  <span className="truncate">
                    {m.full_name || m.email || "ללא שם"}
                    {m.id === user?.id && (
                      <span className="text-xs opacity-60 mr-1">(אני)</span>
                    )}
                  </span>
                  {selected && <Check className="h-4 w-4" style={{ color: "#d8ac27" }} />}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
