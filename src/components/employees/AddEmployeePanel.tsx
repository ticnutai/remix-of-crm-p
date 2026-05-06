/**
 * AddEmployeePanel — floating, draggable, resizable panel (no backdrop).
 * Closes on Escape. Drag via header. Resize via corner/edge handles.
 */
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  Building,
  Crown,
  DollarSign,
  GripVertical,
  Loader2,
  Mail,
  Phone,
  Shield,
  User,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface AddEmployeeForm {
  email: string;
  full_name: string;
  phone: string;
  department: string;
  position: string;
  hourly_rate: string;
  role: "admin" | "super_manager" | "manager" | "employee";
}

const EMPTY_FORM: AddEmployeeForm = {
  email: "",
  full_name: "",
  phone: "",
  department: "",
  position: "",
  hourly_rate: "",
  role: "employee",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (form: AddEmployeeForm) => Promise<void>;
  isAdmin?: boolean;
  isSaving?: boolean;
}

const ROLES: { value: AddEmployeeForm["role"]; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "employee", label: "עובד",    icon: <User className="h-3.5 w-3.5" />,    color: "text-muted-foreground" },
  { value: "manager",  label: "מנהל",    icon: <UserCog className="h-3.5 w-3.5" />, color: "text-blue-600" },
  { value: "super_manager", label: "מנהל-על", icon: <Shield className="h-3.5 w-3.5" />, color: "text-purple-600" },
  { value: "admin",    label: "אדמין",   icon: <Crown className="h-3.5 w-3.5" />,   color: "text-red-600" },
];

// Minimum / default dimensions
const MIN_W = 360;
const MIN_H = 420;
const DEFAULT_W = 460;
const DEFAULT_H = 540;

export function AddEmployeePanel({ open, onClose, onSubmit, isAdmin = false, isSaving = false }: Props) {
  const [form, setForm] = useState<AddEmployeeForm>(EMPTY_FORM);

  // Position & size
  const [pos, setPos] = useState(() => ({
    x: Math.max(40, window.innerWidth / 2 - DEFAULT_W / 2),
    y: Math.max(40, window.innerHeight / 2 - DEFAULT_H / 2),
  }));
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });

  // Drag state
  const dragging = useRef(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Resize state
  const resizing = useRef<null | { edge: string; mx: number; my: number; x: number; y: number; w: number; h: number }>(null);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Reset form when opening
  useEffect(() => {
    if (open) setForm(EMPTY_FORM);
  }, [open]);

  // Global mouse move/up for drag & resize
  useEffect(() => {
    if (!open) return;

    const onMove = (e: MouseEvent) => {
      if (dragging.current) {
        const { mx, my, px, py } = dragOrigin.current;
        setPos({
          x: Math.max(0, Math.min(window.innerWidth - size.w, px + e.clientX - mx)),
          y: Math.max(0, Math.min(window.innerHeight - 60, py + e.clientY - my)),
        });
        return;
      }
      const r = resizing.current;
      if (!r) return;
      const dx = e.clientX - r.mx;
      const dy = e.clientY - r.my;

      let newX = r.x, newY = r.y, newW = r.w, newH = r.h;

      if (r.edge.includes("e")) newW = Math.max(MIN_W, r.w + dx);
      if (r.edge.includes("w")) { newW = Math.max(MIN_W, r.w - dx); newX = r.x + (r.w - newW); }
      if (r.edge.includes("s")) newH = Math.max(MIN_H, r.h + dy);
      if (r.edge.includes("n")) { newH = Math.max(MIN_H, r.h - dy); newY = r.y + (r.h - newH); }

      setSize({ w: newW, h: newH });
      setPos({ x: newX, y: newY });
    };

    const onUp = () => {
      dragging.current = false;
      resizing.current = null;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open, size.w]);

  const startDrag = (e: React.MouseEvent) => {
    dragging.current = true;
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    document.body.style.userSelect = "none";
    e.preventDefault();
  };

  const startResize = (edge: string) => (e: React.MouseEvent) => {
    resizing.current = { edge, mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y, w: size.w, h: size.h };
    document.body.style.userSelect = "none";
    const cursors: Record<string, string> = { n: "n-resize", s: "s-resize", e: "e-resize", w: "w-resize", ne: "ne-resize", nw: "nw-resize", se: "se-resize", sw: "sw-resize" };
    document.body.style.cursor = cursors[edge] ?? "auto";
    e.preventDefault();
    e.stopPropagation();
  };

  const set = (k: keyof AddEmployeeForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(form);
  };

  if (!open) return null;

  const HANDLE = "absolute bg-transparent z-10";

  return (
    <div
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      className="fixed z-50 flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden"
      dir="rtl"
    >
      {/* ── Resize handles ── */}
      {/* edges */}
      <div className={`${HANDLE} top-0 left-3 right-3 h-1.5 cursor-n-resize`} onMouseDown={startResize("n")} />
      <div className={`${HANDLE} bottom-0 left-3 right-3 h-1.5 cursor-s-resize`} onMouseDown={startResize("s")} />
      <div className={`${HANDLE} right-0 top-3 bottom-3 w-1.5 cursor-e-resize`} onMouseDown={startResize("e")} />
      <div className={`${HANDLE} left-0 top-3 bottom-3 w-1.5 cursor-w-resize`} onMouseDown={startResize("w")} />
      {/* corners */}
      <div className={`${HANDLE} top-0 right-0 w-4 h-4 cursor-ne-resize`} onMouseDown={startResize("ne")} />
      <div className={`${HANDLE} top-0 left-0 w-4 h-4 cursor-nw-resize`} onMouseDown={startResize("nw")} />
      <div className={`${HANDLE} bottom-0 right-0 w-4 h-4 cursor-se-resize`} onMouseDown={startResize("se")} />
      <div className={`${HANDLE} bottom-0 left-0 w-4 h-4 cursor-sw-resize`} onMouseDown={startResize("sw")} />

      {/* ── Header / drag handle ── */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b bg-muted/50 cursor-move select-none shrink-0"
        onMouseDown={startDrag}
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <UserPlus className="h-4 w-4" />
          הוספת עובד חדש
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 hover:bg-muted transition-colors"
          title="סגור (Escape)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <ScrollArea className="flex-1 min-h-0">
        <form id="add-emp-form" onSubmit={handleSubmit} className="p-4 space-y-4">
          <p className="text-xs text-muted-foreground -mt-1">
            ישלח אימייל לעובד החדש עם קישור לאיפוס סיסמה.
          </p>

          {/* Email */}
          <div className="space-y-1">
            <Label htmlFor="ae-email">אימייל *</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="ae-email"
                type="email"
                required
                autoComplete="off"
                className="pr-10"
                dir="ltr"
                placeholder="employee@example.com"
                value={form.email}
                onChange={set("email")}
              />
            </div>
          </div>

          {/* Full name */}
          <div className="space-y-1">
            <Label htmlFor="ae-name">שם מלא *</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="ae-name"
                required
                className="pr-10"
                placeholder="ישראל ישראלי"
                value={form.full_name}
                onChange={set("full_name")}
              />
            </div>
          </div>

          {/* Phone + Hourly rate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ae-phone">טלפון</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="ae-phone"
                  type="tel"
                  className="pr-10"
                  dir="ltr"
                  placeholder="050-0000000"
                  value={form.phone}
                  onChange={set("phone")}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ae-rate">תעריף שעתי (₪)</Label>
              <div className="relative">
                <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="ae-rate"
                  type="number"
                  min={0}
                  className="pr-10"
                  dir="ltr"
                  placeholder="50"
                  value={form.hourly_rate}
                  onChange={set("hourly_rate")}
                />
              </div>
            </div>
          </div>

          {/* Department + Position */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ae-dept">מחלקה</Label>
              <div className="relative">
                <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="ae-dept"
                  className="pr-10"
                  placeholder="פיתוח"
                  value={form.department}
                  onChange={set("department")}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ae-pos">משרה</Label>
              <div className="relative">
                <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="ae-pos"
                  className="pr-10"
                  placeholder="מפתח"
                  value={form.position}
                  onChange={set("position")}
                />
              </div>
            </div>
          </div>

          {/* Role buttons */}
          {isAdmin && (
            <div className="space-y-1.5">
              <Label>הרשאה</Label>
              <div className="flex gap-2 flex-wrap">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role: r.value }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                      form.role === r.value
                        ? "border-primary bg-primary text-primary-foreground shadow"
                        : "border-muted bg-muted/30 hover:bg-muted/60",
                    )}
                  >
                    <span className={form.role === r.value ? "text-primary-foreground" : r.color}>
                      {r.icon}
                    </span>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>
      </ScrollArea>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-t bg-muted/20 shrink-0">
        <Button variant="ghost" size="sm" onClick={onClose} type="button">
          ביטול
        </Button>
        <Button
          type="submit"
          form="add-emp-form"
          disabled={isSaving || !form.email || !form.full_name}
          className="btn-gold gap-2"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          הוסף עובד
        </Button>
      </div>
    </div>
  );
}
