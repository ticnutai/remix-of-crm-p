import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] || char);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRoleKey || !anonKey || !resendKey) {
      return json({ error: "Missing server configuration" }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const allowed = (roles || []).some(({ role }) =>
      ["admin", "super_manager", "manager"].includes(role)
    );
    if (!allowed) return json({ error: "Management access required" }, 403);

    const {
      clientId,
      temporaryPassword,
      portalUrl,
      businessName = Deno.env.get("BUSINESS_NAME") || "TENARCH",
    } = await req.json();
    if (!clientId || !portalUrl) return json({ error: "clientId and portalUrl are required" }, 400);

    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("id, name, email, user_id")
      .eq("id", clientId)
      .single();
    if (clientError || !client?.user_id || !client.email) {
      return json({ error: "Client portal account was not found" }, 404);
    }

    let actionUrl = portalUrl;
    if (!temporaryPassword) {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: client.email,
        options: { redirectTo: portalUrl },
      });
      if (linkError) throw linkError;
      actionUrl = linkData.properties.action_link;
    }

    const safeName = escapeHtml(client.name || "לקוח/ה");
    const safeEmail = escapeHtml(client.email);
    const safeBusiness = escapeHtml(String(businessName));
    const passwordBlock = temporaryPassword
      ? `<div style="margin-top:12px"><span style="color:#64748b">סיסמה זמנית:</span>
          <div style="direction:ltr;font:600 18px monospace;background:#fff;padding:9px 12px;border:1px solid #e2e8f0;border-radius:6px;margin-top:5px">${escapeHtml(String(temporaryPassword))}</div></div>`
      : `<p style="color:#475569;line-height:1.6">לחיצה על הכפתור תאפשר לבחור סיסמה אישית ומיד לאחר מכן להיכנס לפורטל.</p>`;

    const resend = new Resend(resendKey);
    const response = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM") || `${safeBusiness} <onboarding@resend.dev>`,
      to: [client.email],
      subject: `הגישה שלך לפורטל הלקוחות של ${businessName}`,
      html: `<html dir="rtl" lang="he"><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
        <div style="max-width:600px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
          <div style="background:#17365f;color:#fff;padding:28px;text-align:center"><h1 style="margin:0">פורטל הלקוחות</h1><p>${safeBusiness}</p></div>
          <div style="padding:30px"><p style="font-size:18px">שלום ${safeName},</p>
            <p style="color:#475569;line-height:1.6">נפתחה עבורך גישה מאובטחת לצפייה בפרויקטים, קבצים, הודעות, פגישות ותשלומים.</p>
            <div style="background:#f8fafc;border-right:4px solid #d6a934;padding:16px;border-radius:8px">
              <span style="color:#64748b">שם משתמש:</span><div style="direction:ltr;font-weight:600">${safeEmail}</div>${passwordBlock}
            </div>
            <div style="text-align:center;margin:28px"><a href="${escapeHtml(actionUrl)}" style="background:#17365f;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700">${temporaryPassword ? "כניסה לפורטל" : "הגדרת סיסמה וכניסה"}</a></div>
            <p style="font-size:13px;color:#64748b">מטעמי אבטחה אין להעביר את ההודעה לאחרים.</p>
          </div>
        </div></body></html>`,
    });
    if (response.error) throw new Error(response.error.message);

    return json({ success: true, emailId: response.data?.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
