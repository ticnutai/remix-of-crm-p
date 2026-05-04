// Floating Action Button — quick clock in/out from any page.
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LogIn, LogOut, Clock } from "lucide-react";
import {
  AttendanceRecord, getOpenShift, clockIn, clockOut, formatMinutes,
} from "@/lib/attendance";
import { cn } from "@/lib/utils";

export function AttendanceFAB() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [shift, setShift] = useState<AttendanceRecord | null>(null);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  // Hide on auth, attendance pages, and client portal
  const hide =
    !user ||
    location.pathname.startsWith("/auth") ||
    location.pathname.startsWith("/attendance") ||
    location.pathname.startsWith("/client-portal");

  useEffect(() => {
    if (!user || hide) return;
    let cancelled = false;
    getOpenShift(user.id).then(s => { if (!cancelled) setShift(s); }).catch(() => {});
    return () => { cancelled = true; };
  }, [user?.id, hide, location.pathname]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000); // every 30s
    return () => clearInterval(t);
  }, []);

  if (hide) return null;

  const elapsed = shift
    ? Math.max(0, Math.floor((now - new Date(shift.clock_in).getTime()) / 60000) - (shift.break_minutes ?? 0))
    : 0;

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setBusy(true);
    try {
      if (shift) {
        await clockOut(shift.id);
        setShift(null);
        toast({ title: "יציאה נרשמה", description: `סה״כ ${formatMinutes(elapsed)}` });
      } else {
        const s = await clockIn(user.id);
        setShift(s);
        toast({ title: "כניסה נרשמה" });
      }
    } catch (err: any) {
      toast({ title: "שגיאה", description: err.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 print:hidden">
      <Button
        onClick={() => navigate("/attendance")}
        size="sm"
        variant="outline"
        className="shadow-lg backdrop-blur bg-background/80"
        title="פתח עמוד נוכחות"
      >
        <Clock className="h-4 w-4" />
        {shift && <span className="mr-1 tabular-nums">{formatMinutes(elapsed)}</span>}
      </Button>
      <Button
        onClick={toggle}
        disabled={busy}
        size="sm"
        className={cn(
          "shadow-lg",
          shift ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700",
        )}
        title={shift ? "יציאה" : "כניסה"}
      >
        {shift ? <LogOut className="h-4 w-4" /> : <LogIn className="h-4 w-4" />}
        <span className="mr-1">{shift ? "יציאה" : "כניסה"}</span>
      </Button>
    </div>
  );
}
