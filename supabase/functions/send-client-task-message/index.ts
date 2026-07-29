import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

type Channel = "whatsapp" | "sms";

interface SendRequest {
  clientId: string;
  taskId: string;
  channel: Channel;
  phoneNumber: string;
  message: string;
}

function normalizePhone(value: unknown): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
}

function collectClientPhones(client: Record<string, unknown>): Set<string> {
  const values: unknown[] = [client.phone, client.phone_secondary, client.whatsapp];
  if (Array.isArray(client.additional_phones)) values.push(...client.additional_phones);
  return new Set(values.map(normalizePhone).filter(Boolean));
}

function fallbackUrl(channel: Channel, phone: string, message: string): string {
  if (channel === "whatsapp") {
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }
  return `sms:+${phone}?body=${encodeURIComponent(message)}`;
}

type SendResult =
  | { ok: true; provider: string; providerMessageId: string | null }
  | { ok: false; provider: string; error: string };

// ================= PROVIDER 1: Personal Twilio (user's own account) =================
async function sendViaPersonalTwilio(
  channel: Channel,
  phone: string,
  message: string,
  creds: { accountSid?: string; authToken?: string; from?: string },
): Promise<SendResult | null> {
  const { accountSid, authToken, from } = creds;
  if (!accountSid || !authToken || !from) return null; // signal: not configured

  const params = new URLSearchParams({
    From: channel === "whatsapp" ? `whatsapp:${from}` : from,
    To: channel === "whatsapp" ? `whatsapp:+${phone}` : `+${phone}`,
    Body: message,
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: params.toString(),
      },
    );
    const body = await res.json().catch(() => ({} as any));
    if (res.ok) {
      return { ok: true, provider: "twilio_personal", providerMessageId: body?.sid ?? null };
    }
    return {
      ok: false,
      provider: "twilio_personal",
      error: body?.message || `Twilio personal rejected (${res.status})`,
    };
  } catch (err) {
    return { ok: false, provider: "twilio_personal", error: (err as Error).message };
  }
}

// ================= PROVIDER 2: GatewayAPI (Lovable connector, SMS only) =================
async function sendViaGatewayAPI(
  phone: string,
  message: string,
  senderName: string,
): Promise<SendResult | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get("GATEWAYAPI_API_KEY");
  if (!lovableKey || !connKey) return null;

  try {
    const res = await fetch("https://connector-gateway.lovable.dev/gatewayapi/mobile/single", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: senderName.slice(0, 11),
        recipient: Number(phone),
        message,
      }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (res.ok) {
      const id = body?.ids?.[0] ?? body?.id ?? null;
      return { ok: true, provider: "gatewayapi_lovable", providerMessageId: id ? String(id) : null };
    }
    return {
      ok: false,
      provider: "gatewayapi_lovable",
      error: body?.message || body?.error || `GatewayAPI rejected (${res.status})`,
    };
  } catch (err) {
    return { ok: false, provider: "gatewayapi_lovable", error: (err as Error).message };
  }
}

// ================= PROVIDER 3: Twilio Connector (Lovable managed, WhatsApp) =================
async function sendViaTwilioConnector(
  channel: Channel,
  phone: string,
  message: string,
  from: string | undefined,
): Promise<SendResult | null> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get("TWILIO_API_KEY");
  if (!lovableKey || !connKey || !from) return null;

  const params = new URLSearchParams({
    From: channel === "whatsapp" ? `whatsapp:${from}` : from,
    To: channel === "whatsapp" ? `whatsapp:+${phone}` : `+${phone}`,
    Body: message,
  });

  try {
    // Gateway automatically prepends /2010-04-01/Accounts/{AccountSid}
    const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const body = await res.json().catch(() => ({} as any));
    if (res.ok) {
      return { ok: true, provider: "twilio_lovable", providerMessageId: body?.sid ?? null };
    }
    return {
      ok: false,
      provider: "twilio_lovable",
      error: body?.message || `Twilio connector rejected (${res.status})`,
    };
  } catch (err) {
    return { ok: false, provider: "twilio_lovable", error: (err as Error).message };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "");
    if (!token) return respond({ success: false, error: "נדרשת התחברות" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) {
      return respond({ success: false, error: "ההתחברות אינה תקפה" }, 401);
    }

    const { clientId, taskId, channel, phoneNumber, message } =
      (await req.json()) as SendRequest;
    if (!clientId || !taskId || !["whatsapp", "sms"].includes(channel)) {
      return respond({ success: false, error: "בקשת השליחה אינה מלאה" }, 400);
    }
    const cleanMessage = String(message || "").trim();
    if (!cleanMessage || cleanMessage.length > 4000) {
      return respond({ success: false, error: "יש להזין הודעה באורך עד 4,000 תווים" }, 400);
    }

    const [{ data: client, error: clientError }, { data: task, error: taskError }] =
      await Promise.all([
        admin
          .from("clients")
          .select("id,name,phone,phone_secondary,whatsapp,additional_phones")
          .eq("id", clientId)
          .single(),
        admin
          .from("client_stage_tasks")
          .select("id,title,client_id,stage_id")
          .eq("id", taskId)
          .eq("client_id", clientId)
          .single(),
      ]);

    if (clientError || taskError || !client || !task) {
      return respond({ success: false, error: "הלקוח או המשימה לא נמצאו" }, 404);
    }

    const phone = normalizePhone(phoneNumber);
    if (!phone || !collectClientPhones(client).has(phone)) {
      return respond({ success: false, error: "המספר אינו משויך ללקוח הנוכחי" }, 400);
    }

    const { data: stage } = await admin
      .from("client_stages")
      .select("stage_name")
      .eq("client_id", clientId)
      .eq("stage_id", task.stage_id)
      .maybeSingle();

    // Load personal Twilio credentials + fallback config from platform_settings
    const { data: settingsRows } = await admin
      .from("platform_settings")
      .select("key,value")
      .in("key", [
        "twilio:TWILIO_ACCOUNT_SID",
        "twilio:TWILIO_AUTH_TOKEN",
        "twilio:TWILIO_PHONE_NUMBER",
        "twilio:TWILIO_WHATSAPP_NUMBER",
        "gatewayapi:SENDER_NAME",
        "lovable_twilio:WHATSAPP_FROM",
        "lovable_twilio:SMS_FROM",
      ]);
    const settings = new Map(
      (settingsRows || []).map((row: { key: string; value: string }) => [row.key, row.value]),
    );

    const personalCreds = {
      accountSid: settings.get("twilio:TWILIO_ACCOUNT_SID"),
      authToken: settings.get("twilio:TWILIO_AUTH_TOKEN"),
      from: channel === "whatsapp"
        ? settings.get("twilio:TWILIO_WHATSAPP_NUMBER")
        : settings.get("twilio:TWILIO_PHONE_NUMBER"),
    };
    const senderName = settings.get("gatewayapi:SENDER_NAME") || "CRM";
    const lovableTwilioFrom = channel === "whatsapp"
      ? settings.get("lovable_twilio:WHATSAPP_FROM")
      : settings.get("lovable_twilio:SMS_FROM");

    const attempts: Array<{ provider: string; error?: string; ok: boolean }> = [];
    let finalResult: SendResult | null = null;

    // ==== 1. Try Personal Twilio ====
    const personal = await sendViaPersonalTwilio(channel, phone, cleanMessage, personalCreds);
    if (personal) {
      attempts.push({ provider: personal.provider, ok: personal.ok, error: personal.ok ? undefined : personal.error });
      if (personal.ok) finalResult = personal;
    } else {
      attempts.push({ provider: "twilio_personal", ok: false, error: "not_configured" });
    }

    // ==== 2. Fallback to Lovable connector if personal failed/missing ====
    if (!finalResult) {
      const lovable = channel === "sms"
        ? await sendViaGatewayAPI(phone, cleanMessage, senderName)
        : await sendViaTwilioConnector(channel, phone, cleanMessage, lovableTwilioFrom);

      if (lovable) {
        attempts.push({ provider: lovable.provider, ok: lovable.ok, error: lovable.ok ? undefined : lovable.error });
        if (lovable.ok) finalResult = lovable;
      } else {
        attempts.push({
          provider: channel === "sms" ? "gatewayapi_lovable" : "twilio_lovable",
          ok: false,
          error: "not_configured",
        });
      }
    }

    const appUrl = fallbackUrl(channel, phone, cleanMessage);
    const status: "sent" | "failed" = finalResult?.ok ? "sent" : "failed";
    const provider = finalResult?.ok ? finalResult.provider : (attempts[0]?.provider || "none");
    const providerMessageId = finalResult?.ok ? finalResult.providerMessageId : null;
    const lastError = attempts.filter((a) => !a.ok).map((a) => `${a.provider}: ${a.error}`).join(" | ") || null;

    const { error: logError } = await admin.from("client_task_message_log").insert({
      client_id: clientId,
      task_id: taskId,
      stage_id: task.stage_id,
      stage_name: stage?.stage_name || null,
      channel,
      phone_number: `+${phone}`,
      message: cleanMessage,
      status,
      provider,
      provider_message_id: providerMessageId,
      error_message: status === "sent" ? null : lastError,
      sent_by: authData.user.id,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
    if (logError) console.error("Failed to write task message log", logError.message);

    if (status === "sent") {
      return respond({
        success: true,
        mode: "provider",
        provider,
        providerMessageId,
        attempts,
      });
    }
    return respond({
      success: false,
      mode: "app",
      fallbackUrl: appUrl,
      error: lastError || "לא הצלחנו לשלוח דרך אף אחד מהערוצים",
      attempts,
    });
  } catch (error) {
    console.error("send-client-task-message failed", error);
    return new Response(
      JSON.stringify({ success: false, error: "שגיאה לא צפויה בשליחת ההודעה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
