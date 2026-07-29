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

    const { data: credentialRows } = await admin
      .from("platform_settings")
      .select("key,value")
      .in("key", [
        "twilio:TWILIO_ACCOUNT_SID",
        "twilio:TWILIO_AUTH_TOKEN",
        "twilio:TWILIO_PHONE_NUMBER",
        "twilio:TWILIO_WHATSAPP_NUMBER",
      ]);
    const credentials = new Map(
      (credentialRows || []).map((row: { key: string; value: string }) => [row.key, row.value]),
    );
    const accountSid = credentials.get("twilio:TWILIO_ACCOUNT_SID");
    const authToken = credentials.get("twilio:TWILIO_AUTH_TOKEN");
    const from = channel === "whatsapp"
      ? credentials.get("twilio:TWILIO_WHATSAPP_NUMBER")
      : credentials.get("twilio:TWILIO_PHONE_NUMBER");
    const appUrl = fallbackUrl(channel, phone, cleanMessage);

    if (!accountSid || !authToken || !from) {
      return respond({
        success: true,
        mode: "app",
        fallbackUrl: appUrl,
        reason: "provider_not_configured",
      });
    }

    let status: "sent" | "failed" = "failed";
    const provider = "twilio";
    let providerMessageId: string | null = null;
    let providerError: string | null = null;

    const params = new URLSearchParams({
      From: channel === "whatsapp" ? `whatsapp:${from}` : from,
      To: channel === "whatsapp" ? `whatsapp:+${phone}` : `+${phone}`,
      Body: cleanMessage,
    });
    const twilioResponse = await fetch(
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
    const twilioBody = await twilioResponse.json().catch(() => ({}));
    if (twilioResponse.ok) {
      status = "sent";
      providerMessageId = typeof twilioBody.sid === "string" ? twilioBody.sid : null;
    } else {
      providerError = typeof twilioBody.message === "string"
        ? twilioBody.message
        : "Twilio rejected the message";
    }

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
      error_message: providerError,
      sent_by: authData.user.id,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    });
    if (logError) console.error("Failed to write task message log", logError.message);

    if (status === "sent") {
      return respond({ success: true, mode: "provider", provider, providerMessageId });
    }
    return respond({
      success: status !== "failed",
      mode: "app",
      fallbackUrl: appUrl,
      error: providerError,
    });
  } catch (error) {
    console.error("send-client-task-message failed", error);
    return new Response(
      JSON.stringify({ success: false, error: "שגיאה לא צפויה בשליחת ההודעה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
