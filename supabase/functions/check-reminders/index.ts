import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

// Twilio credentials loaded from platform_settings table (set by admin in Settings page)
let _twilioAccountSid: string | null = null;
let _twilioAuthToken: string | null = null;
let _twilioWhatsAppFrom: string | null = null;

async function loadTwilioCredentials(db: ReturnType<typeof createClient>) {
  if (_twilioAccountSid) return; // already loaded
  try {
    const { data } = await db
      .from("platform_settings")
      .select("key, value")
      .in("key", [
        "twilio:TWILIO_ACCOUNT_SID",
        "twilio:TWILIO_AUTH_TOKEN",
        "twilio:TWILIO_WHATSAPP_NUMBER",
      ]);
    if (data) {
      data.forEach((row: { key: string; value: string }) => {
        if (row.key === "twilio:TWILIO_ACCOUNT_SID") _twilioAccountSid = row.value;
        if (row.key === "twilio:TWILIO_AUTH_TOKEN") _twilioAuthToken = row.value;
        if (row.key === "twilio:TWILIO_WHATSAPP_NUMBER") _twilioWhatsAppFrom = row.value;
      });
    }
  } catch (e) {
    console.error("Failed to load Twilio credentials:", e);
  }
}

function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return "972" + digits.slice(1);
  return digits;
}

async function sendWhatsApp(to: string, body: string): Promise<boolean> {
  if (!_twilioAccountSid || !_twilioAuthToken || !_twilioWhatsAppFrom) {
    console.log("Twilio not configured, skipping WhatsApp");
    return false;
  }
  const phone = formatPhoneForWhatsApp(to);
  if (!phone) {
    console.log("WhatsApp: no phone number provided");
    return false;
  }
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${_twilioAccountSid}/Messages.json`;
    const params = new URLSearchParams({
      From: `whatsapp:${_twilioWhatsAppFrom}`,
      To: `whatsapp:+${phone}`,
      Body: body,
    });
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + btoa(`${_twilioAccountSid}:${_twilioAuthToken}`),
      },
      body: params.toString(),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Twilio WhatsApp error:", err);
      return false;
    }
    console.log("WhatsApp sent to:", phone);
    return true;
  } catch (e) {
    console.error("sendWhatsApp error:", e);
    return false;
  }
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Load Twilio creds on startup
await loadTwilioCredentials(supabase);

async function sendEmail(
  to: string,
  title: string,
  message: string,
  userName?: string,
) {
  if (!RESEND_API_KEY) {
    console.log("RESEND_API_KEY not configured, skipping email");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ArchFlow <onboarding@resend.dev>",
        to: [to],
        subject: `⏰ תזכורת: ${title}`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">⏰ תזכורת</h1>
              </div>
              <div style="padding: 30px;">
                ${userName ? `<p style="color: #666; font-size: 16px; margin-bottom: 20px;">שלום ${userName},</p>` : ""}
                <h2 style="color: #333; font-size: 24px; margin-bottom: 15px;">${title}</h2>
                ${message ? `<p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>` : ""}
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; text-align: center;">
                    זוהי תזכורת אוטומטית מ-ArchFlow
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      console.error("Resend API error:", errorData);
      return false;
    }

    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Checking for due reminders...");

  try {
    const now = new Date().toISOString();

    // Get reminders that are due and not yet sent
    const { data: dueReminders, error: fetchError } = await supabase
      .from("reminders")
      .select("*")
      .lte("remind_at", now)
      .eq("is_sent", false)
      .eq("is_dismissed", false);

    if (fetchError) {
      throw fetchError;
    }

    // Fetch profiles for email lookup
    const userIds = [...new Set((dueReminders || []).map((r: any) => r.user_id).filter(Boolean))];
    const profileMap: Record<string, { full_name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
    }

    console.log(`Found ${dueReminders?.length || 0} due reminders`);

    const results = {
      processed: 0,
      emailsSent: 0,
      whatsappSent: 0,
      errors: 0,
    };

    if (dueReminders && dueReminders.length > 0) {
      for (const reminder of dueReminders) {
        try {
          const profile = profileMap[reminder.user_id] || null;
          const reminderTypes = reminder.reminder_types || ["browser"];
          const emailTemplate = null; // email_template support removed (no FK)

          // Check if email should be sent
          if (reminderTypes.includes("email") && profile?.email) {
            // Prepare email payload with template support
            const emailPayload: any = {
              to: profile.email,
              title: reminder.title,
              message: reminder.message || "",
              userName: profile.full_name,
              reminderId: reminder.id,
              userId: reminder.user_id,
            };

            // Add template if specified
            if (emailTemplate) {
              emailPayload.templateId = emailTemplate.id;
              emailPayload.variables = reminder.email_variables || {};
            }

            // Call send-reminder-email function
            const emailRes = await fetch(
              `${SUPABASE_URL}/functions/v1/send-reminder-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify(emailPayload),
              },
            );

            if (emailRes.ok) {
              results.emailsSent++;
            }
          }

          // Also send to recipient emails if specified
          if (
            reminder.recipient_emails &&
            reminder.recipient_emails.length > 0
          ) {
            for (const email of reminder.recipient_emails) {
              const emailSent = await sendEmail(
                email,
                reminder.title,
                reminder.message || "",
                undefined,
              );
              if (emailSent) {
                results.emailsSent++;
              }
            }
          }

          // Send WhatsApp via Twilio if reminder_type includes whatsapp
          if (
            reminderTypes.includes("whatsapp") &&
            reminder.recipient_phone
          ) {
            const waBody = `\u23f0 ${reminder.title}${
              reminder.message ? `\n${reminder.message}` : ""
            }`;
            const sent = await sendWhatsApp(reminder.recipient_phone, waBody);
            if (sent) results.whatsappSent++;
          }

          // Mark reminder as sent
          const updateData: any = {
            is_sent: true,
            times_sent: (reminder.times_sent || 0) + 1,
          };

          // Handle recurring reminders
          if (reminder.is_recurring && reminder.recurring_interval) {
            const currentRemindAt = new Date(reminder.remind_at);
            let nextRemindAt: Date;

            switch (reminder.recurring_interval) {
              case "daily":
                nextRemindAt = new Date(
                  currentRemindAt.getTime() + 24 * 60 * 60 * 1000,
                );
                break;
              case "weekly":
                nextRemindAt = new Date(
                  currentRemindAt.getTime() + 7 * 24 * 60 * 60 * 1000,
                );
                break;
              case "monthly":
                nextRemindAt = new Date(currentRemindAt);
                nextRemindAt.setMonth(nextRemindAt.getMonth() + 1);
                break;
              default:
                nextRemindAt = currentRemindAt;
            }

            // Check if we should continue recurring
            const maxTimes = reminder.recurring_count || 1;
            if (updateData.times_sent < maxTimes) {
              updateData.remind_at = nextRemindAt.toISOString();
              updateData.is_sent = false;
            }
          }

          const { error: updateError } = await supabase
            .from("reminders")
            .update(updateData)
            .eq("id", reminder.id);

          if (updateError) {
            console.error(
              `Error updating reminder ${reminder.id}:`,
              updateError,
            );
            results.errors++;
          } else {
            results.processed++;
          }
        } catch (reminderError) {
          console.error(
            `Error processing reminder ${reminder.id}:`,
            reminderError,
          );
          results.errors++;
        }
      }
    }

    console.log("Reminder check complete:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} reminders, sent ${results.emailsSent} emails, ${results.whatsappSent} WhatsApp`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error: any) {
    console.error("Error checking reminders:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
