// Edge Function: monthly attendance report → email to manager(s).
// Trigger via HTTP POST or schedule with pg_cron / Supabase scheduler.
// Body (optional): { monthOffset?: number, recipientEmail?: string }
//   monthOffset = 0 means current month, -1 = previous month (default = -1).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const REGULAR_DAY_MINUTES = 510;

function fmtMin(n: number): string {
  const v = Math.max(0, Math.round(n));
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

interface AttRow {
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  duration_minutes: number | null;
  break_minutes: number | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const monthOffset: number = typeof body.monthOffset === "number" ? body.monthOffset : -1;
    const recipientEmail: string | undefined = body.recipientEmail;

    const ref = new Date();
    ref.setMonth(ref.getMonth() + monthOffset);
    const from = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const to   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59);
    const monthLabel = `${from.getMonth() + 1}/${from.getFullYear()}`;

    const { data: records, error } = await supabase
      .from("attendance_records")
      .select("user_id, clock_in, clock_out, duration_minutes, break_minutes")
      .gte("clock_in", from.toISOString())
      .lte("clock_in", to.toISOString())
      .returns<AttRow[]>();
    if (error) throw error;

    // load profile names
    const userIds = Array.from(new Set((records ?? []).map(r => r.user_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);
    const nameOf = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    type Sum = { name: string; email: string; shifts: number; total: number; ot: number; missing: number };
    const summary = new Map<string, Sum>();
    for (const r of records ?? []) {
      let s = summary.get(r.user_id);
      if (!s) {
        const p: any = nameOf.get(r.user_id);
        s = { name: p?.full_name ?? r.user_id.slice(0, 8), email: p?.email ?? "", shifts: 0, total: 0, ot: 0, missing: 0 };
        summary.set(r.user_id, s);
      }
      if (r.clock_out) {
        s.shifts += 1;
        s.total += r.duration_minutes ?? 0;
        s.ot += Math.max(0, (r.duration_minutes ?? 0) - REGULAR_DAY_MINUTES);
      } else {
        s.missing += 1;
      }
    }

    const rows = Array.from(summary.values()).sort((a, b) => b.total - a.total);

    // figure out recipients: explicit param OR all admins
    let recipients: string[] = [];
    if (recipientEmail) {
      recipients = [recipientEmail];
    } else {
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id, profiles:profiles!user_roles_user_id_fkey(email)")
        .in("role", ["admin", "super_manager"]);
      recipients = Array.from(new Set(((admins ?? []) as any[])
        .map(a => a.profiles?.email).filter(Boolean)));
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ ok: false, reason: "no recipients" }),
        { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif;">
        <h2>דוח נוכחות חודשי — ${monthLabel}</h2>
        <p>סה״כ עובדים: ${rows.length} • סה״כ שעות: ${fmtMin(rows.reduce((s, r) => s + r.total, 0))}</p>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
          <thead style="background:#f3f4f6;">
            <tr><th>עובד</th><th>אימייל</th><th>משמרות</th><th>סה״כ</th><th>שעות נוספות</th><th>חוסר יציאה</th></tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.name}</td>
                <td>${r.email}</td>
                <td>${r.shifts}</td>
                <td><b>${fmtMin(r.total)}</b></td>
                <td style="color:#ea580c;">${fmtMin(r.ot)}</td>
                <td>${r.missing > 0 ? `<span style="color:#dc2626;">${r.missing}</span>` : "—"}</td>
              </tr>`).join("")}
          </tbody>
        </table>
        <p style="color:#6b7280; font-size:12px; margin-top:16px;">
          דוח אוטומטי — נוצר ${new Date().toLocaleString("he-IL")}
        </p>
      </div>`;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "CRM Attendance <noreply@resend.dev>",
        to: recipients,
        subject: `דוח נוכחות חודשי - ${monthLabel}`,
        html,
      }),
    });
    const sendJson = await sendRes.json();

    return new Response(JSON.stringify({ ok: true, monthLabel, recipients, employees: rows.length, sendJson }),
      { status: 200, headers: { ...corsHeaders, "content-type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
