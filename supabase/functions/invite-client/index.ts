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

const normalizePhone = (value: unknown) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00972")) return digits.slice(2);
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits.length === 9 ? `972${digits}` : digits;
};

const normalizeLocalPhone = (value: unknown) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("00972")) return `0${digits.slice(5)}`;
  if (digits.startsWith("972")) return `0${digits.slice(3)}`;
  if (digits.length === 9 && !digits.startsWith("0")) return `0${digits}`;
  return digits;
};

const resolvePortalUrl = (value: unknown) => {
  try {
    const url = new URL(String(value || ""));
    if (["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
      return Deno.env.get("PUBLIC_APP_URL") || "https://crmtenarch.lovable.app/auth";
    }
    return url.toString();
  } catch {
    return Deno.env.get("PUBLIC_APP_URL") || "https://crmtenarch.lovable.app/auth";
  }
};

const randomTemporaryPassword = () =>
  `${crypto.randomUUID()}-${crypto.randomUUID()}`;

const privilegedRoles = new Set([
  "admin",
  "super_manager",
  "manager",
  "employee",
]);

const clientPhones = (client: Record<string, unknown>) => {
  const values = [client.phone, client.phone_secondary, client.whatsapp];
  if (Array.isArray(client.additional_phones)) values.push(...client.additional_phones);
  return new Set(values.map(normalizePhone).filter(Boolean));
};

async function sendWhatsApp(
  admin: ReturnType<typeof createClient>,
  phone: string,
  message: string,
) {
  const { data: rows } = await admin
    .from("platform_settings")
    .select("key,value")
    .in("key", [
      "twilio:TWILIO_ACCOUNT_SID",
      "twilio:TWILIO_AUTH_TOKEN",
      "twilio:TWILIO_WHATSAPP_NUMBER",
      "lovable_twilio:WHATSAPP_FROM",
    ]);
  const settings = new Map(
    (rows || []).map((row: { key: string; value: string }) => [row.key, row.value]),
  );

  const personalSid = settings.get("twilio:TWILIO_ACCOUNT_SID");
  const personalToken = settings.get("twilio:TWILIO_AUTH_TOKEN");
  const personalFrom = settings.get("twilio:TWILIO_WHATSAPP_NUMBER");
  if (personalSid && personalToken && personalFrom) {
    const params = new URLSearchParams({
      From: `whatsapp:${personalFrom}`,
      To: `whatsapp:+${phone}`,
      Body: message,
    });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${personalSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${personalSid}:${personalToken}`)}`,
        },
        body: params.toString(),
      },
    );
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, provider: "twilio_personal", messageId: body?.sid || null };
    }
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connectorKey = Deno.env.get("TWILIO_API_KEY");
  const connectorFrom = settings.get("lovable_twilio:WHATSAPP_FROM");
  if (lovableKey && connectorKey && connectorFrom) {
    const params = new URLSearchParams({
      From: `whatsapp:${connectorFrom}`,
      To: `whatsapp:+${phone}`,
      Body: message,
    });
    const response = await fetch(
      "https://connector-gateway.lovable.dev/twilio/Messages.json",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": connectorKey,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      },
    );
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      return { success: true, provider: "twilio_lovable", messageId: body?.sid || null };
    }
  }

  return {
    success: false,
    mode: "app",
    fallbackUrl: `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
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
      channel = "email",
      phoneNumber,
      businessName = Deno.env.get("BUSINESS_NAME") || "TENARCH",
    } = await req.json();
    if (!clientId || !portalUrl) return json({ error: "clientId and portalUrl are required" }, 400);

    const { data: client, error: clientError } = await admin
      .from("clients")
      .select("id, name, email, phone, phone_secondary, whatsapp, additional_phones, user_id")
      .eq("id", clientId)
      .single();
    if (clientError || !client?.user_id || !client.email) {
      return json({ error: "Client portal account was not found" }, 404);
    }

    const resolvedPortalUrl = resolvePortalUrl(portalUrl);
    const normalizedEmail = String(client.email).trim().toLowerCase();
    const effectiveTemporaryPassword = temporaryPassword
      ? String(temporaryPassword).replace(/\s/g, "")
      : channel === "whatsapp"
        ? normalizeLocalPhone(phoneNumber || client.phone)
        : "";

    if (effectiveTemporaryPassword && effectiveTemporaryPassword.length < 6) {
      return json({ error: "Temporary password must contain at least 6 characters" }, 400);
    }

    const linkedUserId = client.user_id;
    const { data: authUserData, error: authUserError } =
      await admin.auth.admin.getUserById(client.user_id);
    if (authUserError || !authUserData.user) {
      return json({ error: "Client portal user was not found" }, 404);
    }

    const { data: linkedRoleRows, error: linkedRolesError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", linkedUserId);
    if (linkedRolesError) throw linkedRolesError;

    const linkedRoles = (linkedRoleRows || []).map(({ role }) => String(role));
    const isSharedSystemAccount = linkedRoles.some((role) => privilegedRoles.has(role));

    let portalUser = authUserData.user;
    let portalUserId = linkedUserId;
    let currentAuthEmail = String(portalUser.email || "").trim().toLowerCase();

    if (isSharedSystemAccount) {
      const { data: employee } = await admin
        .from("employees")
        .select("email")
        .or(`user_id.eq.${linkedUserId},profile_id.eq.${linkedUserId}`)
        .not("email", "is", null)
        .limit(1)
        .maybeSingle();
      const employeeEmail = String(employee?.email || "").trim().toLowerCase();

      if (
        !employeeEmail ||
        employeeEmail === normalizedEmail ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)
      ) {
        return json({
          error:
            "חשבון הפורטל מקושר למשתמש מערכת. יש לעדכן תחילה את כתובת האימייל של העובד כדי ליצור חשבון לקוח נפרד.",
          code: "PORTAL_ACCOUNT_COLLISION",
        }, 409);
      }

      let restoredSystemEmail = false;
      let createdPortalUserId: string | null = null;
      try {
        if (currentAuthEmail === normalizedEmail) {
          const { error: restoreAuthError } = await admin.auth.admin.updateUserById(
            linkedUserId,
            { email: employeeEmail, email_confirm: true },
          );
          if (restoreAuthError) throw restoreAuthError;
          restoredSystemEmail = true;

          const { error: restoreProfileError } = await admin
            .from("profiles")
            .update({ email: employeeEmail })
            .eq("id", linkedUserId);
          if (restoreProfileError) throw restoreProfileError;
        }

        const { data: createdUserData, error: createUserError } =
          await admin.auth.admin.createUser({
            email: normalizedEmail,
            password: effectiveTemporaryPassword || randomTemporaryPassword(),
            email_confirm: true,
            user_metadata: {
              full_name: client.name || normalizedEmail,
              must_change_password: Boolean(effectiveTemporaryPassword),
            },
          });
        if (createUserError || !createdUserData.user) {
          throw createUserError || new Error("Failed to create dedicated client portal user");
        }

        portalUser = createdUserData.user;
        portalUserId = portalUser.id;
        createdPortalUserId = portalUserId;
        currentAuthEmail = normalizedEmail;

        const { error: roleInsertError } = await admin
          .from("user_roles")
          .upsert(
            { user_id: portalUserId, role: "client" },
            { onConflict: "user_id,role" },
          );
        if (roleInsertError) throw roleInsertError;

        const { error: profileSetupError } = await admin
          .from("profiles")
          .update({
            email: normalizedEmail,
            full_name: client.name || normalizedEmail,
            approval_status: "approved",
            is_active: true,
            approved_at: new Date().toISOString(),
            approved_by: caller.id,
          })
          .eq("id", portalUserId);
        if (profileSetupError) throw profileSetupError;

        const { error: clientLinkError } = await admin
          .from("clients")
          .update({ user_id: portalUserId })
          .eq("id", client.id);
        if (clientLinkError) throw clientLinkError;

        await admin
          .from("user_roles")
          .delete()
          .eq("user_id", linkedUserId)
          .eq("role", "client");
      } catch (separationError) {
        if (createdPortalUserId) {
          await admin.auth.admin.deleteUser(createdPortalUserId);
        }
        if (restoredSystemEmail && currentAuthEmail) {
          await admin.auth.admin.updateUserById(
            linkedUserId,
            { email: normalizedEmail, email_confirm: true },
          );
          await admin
            .from("profiles")
            .update({ email: normalizedEmail })
            .eq("id", linkedUserId);
        }
        throw separationError;
      }
    }

    if (currentAuthEmail !== normalizedEmail) {
      const { error: authEmailError } = await admin.auth.admin.updateUserById(
        portalUserId,
        { email: normalizedEmail, email_confirm: true },
      );
      if (authEmailError) {
        return json({
          error: authEmailError.message.includes("already")
            ? "כתובת האימייל החדשה כבר משויכת לחשבון אחר"
            : `עדכון שם המשתמש נכשל: ${authEmailError.message}`,
        }, 400);
      }

      const { error: profileEmailError } = await admin
        .from("profiles")
        .update({ email: normalizedEmail })
        .eq("id", portalUserId);
      if (profileEmailError) {
        if (currentAuthEmail) {
          await admin.auth.admin.updateUserById(
            portalUserId,
            { email: currentAuthEmail, email_confirm: true },
          );
        }
        throw profileEmailError;
      }
    }

    if (effectiveTemporaryPassword) {
      const { error: passwordError } = await admin.auth.admin.updateUserById(
        portalUserId,
        {
          password: effectiveTemporaryPassword,
          user_metadata: {
            ...(portalUser.user_metadata || {}),
            must_change_password: true,
          },
        },
      );
      if (passwordError) throw passwordError;
    }

    let actionUrl = resolvedPortalUrl;
    if (!effectiveTemporaryPassword) {
      const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: normalizedEmail,
        options: { redirectTo: resolvedPortalUrl },
      });
      if (linkError) throw linkError;
      actionUrl = linkData.properties.action_link;
    }

    const safeName = escapeHtml(client.name || "לקוח/ה");
    const safeEmail = escapeHtml(normalizedEmail);
    const safeBusiness = escapeHtml(String(businessName));
    const passwordBlock = effectiveTemporaryPassword
      ? `<div style="margin-top:12px"><span style="color:#64748b">סיסמה זמנית:</span>
          <div style="direction:ltr;font:600 18px monospace;background:#fff;padding:9px 12px;border:1px solid #e2e8f0;border-radius:6px;margin-top:5px">${escapeHtml(effectiveTemporaryPassword)}</div></div>`
      : `<p style="color:#475569;line-height:1.6">לחיצה על הכפתור תאפשר לבחור סיסמה אישית ומיד לאחר מכן להיכנס לפורטל.</p>`;

    const accessMessage = effectiveTemporaryPassword
      ? `שלום ${client.name},\nנפתחה עבורך גישה לפורטל הלקוחות של ${businessName}.\n\nשם משתמש: ${normalizedEmail}\nסיסמה זמנית: ${effectiveTemporaryPassword}\nכניסה: ${resolvedPortalUrl}\n\nבכניסה הראשונה יש לבחור סיסמה חדשה.`
      : `שלום ${client.name},\nנפתחה עבורך גישה מאובטחת לפורטל הלקוחות של ${businessName}.\n\nשם משתמש: ${normalizedEmail}\nלהגדרת סיסמה ולכניסה לפורטל:\n${actionUrl}\n\nהקישור אישי ואין להעבירו לאחרים.`;

    if (channel === "whatsapp") {
      const phone = normalizePhone(phoneNumber || client.whatsapp || client.phone);
      if (!phone || !clientPhones(client).has(phone)) {
        return json({ error: "מספר ה-WhatsApp אינו משויך ללקוח" }, 400);
      }
      const result = await sendWhatsApp(admin, phone, accessMessage);
      return json(result);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ error: "Email provider is not configured" }, 500);

    const resend = new Resend(resendKey);
    const response = await resend.emails.send({
      from: Deno.env.get("RESEND_FROM") || `${safeBusiness} <onboarding@resend.dev>`,
      to: [normalizedEmail],
      subject: `הגישה שלך לפורטל הלקוחות של ${businessName}`,
      html: `<html dir="rtl" lang="he"><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a">
        <div style="max-width:600px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
          <div style="background:#17365f;color:#fff;padding:28px;text-align:center"><h1 style="margin:0">פורטל הלקוחות</h1><p>${safeBusiness}</p></div>
          <div style="padding:30px"><p style="font-size:18px">שלום ${safeName},</p>
            <p style="color:#475569;line-height:1.6">נפתחה עבורך גישה מאובטחת לצפייה בפרויקטים, קבצים, הודעות, פגישות ותשלומים.</p>
            <div style="background:#f8fafc;border-right:4px solid #d6a934;padding:16px;border-radius:8px">
              <span style="color:#64748b">שם משתמש:</span><div style="direction:ltr;font-weight:600">${safeEmail}</div>${passwordBlock}
            </div>
            <div style="text-align:center;margin:28px"><a href="${escapeHtml(actionUrl)}" style="background:#17365f;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:700">${effectiveTemporaryPassword ? "כניסה לפורטל" : "הגדרת סיסמה וכניסה"}</a></div>
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
