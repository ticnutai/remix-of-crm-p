import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

type CheckStatus = "idle" | "running" | "ok" | "warn" | "fail";

interface CheckResult {
  name: string;
  status: CheckStatus;
  ms?: number;
  detail?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

function decodeJwtRef(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.ref ?? null;
  } catch {
    return null;
  }
}

async function withTiming<T>(
  fn: () => Promise<T>,
  timeoutMs = 12000,
): Promise<{ ok: boolean; ms: number; value?: T; error?: string }> {
  const start = performance.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const value = await fn();
    return { ok: true, ms: Math.round(performance.now() - start), value };
  } catch (e: any) {
    return {
      ok: false,
      ms: Math.round(performance.now() - start),
      error: e?.message || String(e),
    };
  } finally {
    clearTimeout(t);
  }
}

export default function ConnectionDiagnostics() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [running, setRunning] = useState(false);

  const urlRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\./)?.[1] ?? "?";
  const keyRef = SUPABASE_KEY ? decodeJwtRef(SUPABASE_KEY) : null;
  const refsMatch = !!urlRef && !!keyRef && urlRef === keyRef;

  const update = (i: number, patch: Partial<CheckResult>) =>
    setChecks((prev) => prev.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const runChecks = async () => {
    setRunning(true);
    const initial: CheckResult[] = [
      { name: "משתני סביבה (.env)", status: "running" },
      { name: "התאמת ref בין URL ל-anon key", status: "running" },
      { name: "Auth REST: /auth/v1/settings", status: "running" },
      { name: "Auth client: getSession()", status: "running" },
      { name: "DB REST: SELECT clients (limit 1)", status: "running" },
      { name: "DB REST: HEAD profiles", status: "running" },
      { name: "Edge Functions: ping (אופציונלי)", status: "running" },
    ];
    setChecks(initial);

    // 1
    update(0, {
      status: SUPABASE_URL && SUPABASE_KEY ? "ok" : "fail",
      detail: SUPABASE_URL && SUPABASE_KEY
        ? `URL=${SUPABASE_URL}`
        : "VITE_SUPABASE_URL / PUBLISHABLE_KEY חסרים",
    });

    // 2
    update(1, {
      status: refsMatch ? "ok" : "fail",
      detail: `URL ref=${urlRef} | key ref=${keyRef ?? "?"}`,
    });

    // 3 - auth settings
    const r3 = await withTiming(async () => {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        headers: { apikey: SUPABASE_KEY },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    });
    update(2, {
      status: r3.ok ? "ok" : "fail",
      ms: r3.ms,
      detail: r3.ok
        ? `מספקי auth: ${Object.keys(r3.value?.external ?? {}).filter((k) => (r3.value as any).external[k]).join(", ") || "—"}`
        : r3.error,
    });

    // 4 - getSession
    const r4 = await withTiming(async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return data;
    });
    update(4 - 1, {
      status: r4.ok ? "ok" : "fail",
      ms: r4.ms,
      detail: r4.ok
        ? r4.value?.session
          ? `מחובר: ${r4.value.session.user.email ?? r4.value.session.user.id}`
          : "אין session פעיל"
        : r4.error,
    });

    // 5 - DB select
    const r5 = await withTiming(async () => {
      const { error, count } = await (supabase as any)
        .from("clients")
        .select("id", { count: "exact", head: false })
        .limit(1);
      if (error) throw new Error(`${error.code ?? ""} ${error.message}`);
      return count;
    });
    update(4, {
      status: r5.ok ? "ok" : "fail",
      ms: r5.ms,
      detail: r5.ok ? `OK (count=${r5.value ?? "?"})` : r5.error,
    });

    // 6 - HEAD profiles
    const r6 = await withTiming(async () => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`,
        {
          method: "HEAD",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        },
      );
      if (res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res.status;
    });
    update(5, {
      status: r6.ok ? (r6.value === 401 || r6.value === 403 ? "warn" : "ok") : "fail",
      ms: r6.ms,
      detail: r6.ok ? `HTTP ${r6.value}` : r6.error,
    });

    // 7 - edge ping (optional)
    const r7 = await withTiming(async () => {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ping`, {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      return res.status;
    }, 8000);
    update(6, {
      status: r7.ok ? (r7.value === 404 ? "warn" : "ok") : "warn",
      ms: r7.ms,
      detail: r7.ok ? `HTTP ${r7.value}${r7.value === 404 ? " (אין פונקציה בשם ping)" : ""}` : r7.error,
    });

    setRunning(false);
  };

  const StatusIcon = ({ s }: { s: CheckStatus }) => {
    if (s === "running") return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (s === "ok") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (s === "warn") return <AlertCircle className="h-4 w-4 text-amber-600" />;
    if (s === "fail") return <XCircle className="h-4 w-4 text-destructive" />;
    return <span className="h-4 w-4 inline-block" />;
  };

  const summary = (() => {
    if (!checks.length) return null;
    const fails = checks.filter((c) => c.status === "fail").length;
    const warns = checks.filter((c) => c.status === "warn").length;
    if (running) return { tone: "muted", text: "מריץ בדיקות..." };
    if (fails > 0) return { tone: "destructive", text: `${fails} בדיקות נכשלו` };
    if (warns > 0) return { tone: "warn", text: `${warns} אזהרות` };
    return { tone: "ok", text: "הכל תקין ✓" };
  })();

  return (
    <div className="container mx-auto max-w-3xl py-8 px-4" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">בדיקת חיבור לענן</h1>
        <p className="text-sm text-muted-foreground">
          מאמת משתני סביבה, התאמת מפתחות, זמינות Auth ו-Database.
        </p>
      </div>

      <Card className="p-4 mb-4 space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">URL:</span>
          <span className="font-mono text-xs truncate">{SUPABASE_URL || "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Project ref מתוך URL:</span>
          <span className="font-mono text-xs">{urlRef}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Project ref מתוך anon key:</span>
          <span className="font-mono text-xs">{keyRef ?? "—"}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">התאמת ref:</span>
          <span className={refsMatch ? "text-emerald-600" : "text-destructive"}>
            {refsMatch ? "תואם" : "לא תואם"}
          </span>
        </div>
      </Card>

      <div className="flex items-center gap-3 mb-4">
        <Button onClick={runChecks} disabled={running}>
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin ml-2" />
              בודק...
            </>
          ) : (
            "הרץ בדיקות"
          )}
        </Button>
        {summary && (
          <span
            className={
              summary.tone === "ok"
                ? "text-emerald-600 text-sm font-medium"
                : summary.tone === "destructive"
                  ? "text-destructive text-sm font-medium"
                  : summary.tone === "warn"
                    ? "text-amber-600 text-sm font-medium"
                    : "text-muted-foreground text-sm"
            }
          >
            {summary.text}
          </span>
        )}
      </div>

      <Card className="divide-y">
        {checks.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            לחצו "הרץ בדיקות" כדי להתחיל
          </div>
        )}
        {checks.map((c, i) => (
          <div key={i} className="p-3 flex items-start gap-3">
            <StatusIcon s={c.status} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{c.name}</span>
                {typeof c.ms === "number" && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {c.ms}ms
                  </span>
                )}
              </div>
              {c.detail && (
                <div className="text-xs text-muted-foreground mt-0.5 break-words font-mono">
                  {c.detail}
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
