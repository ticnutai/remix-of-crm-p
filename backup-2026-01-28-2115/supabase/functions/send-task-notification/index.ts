import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'task' | 'meeting';
  channels: ('email' | 'sms' | 'whatsapp')[];
  recipient: {
    name: string;
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  details: {
    title: string;
    description?: string;
    date?: string;
    time?: string;
    location?: string;
    priority?: string;
  };
}

const formatPhone = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  // If starts with 0, replace with 972
  if (cleaned.startsWith('0')) {
    cleaned = '972' + cleaned.substring(1);
  }
  return cleaned;
};

const getPriorityLabel = (priority?: string): string => {
  switch (priority) {
    case 'high': return 'גבוהה 🔴';
    case 'medium': return 'בינונית 🟡';
    case 'low': return 'נמוכה 🟢';
    default: return '';
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, channels, recipient, details }: NotificationRequest = await req.json();
    
    console.log(`Sending ${type} notification via ${channels.join(', ')} to:`, recipient.name);
    
    const results: { channel: string; success: boolean; error?: string }[] = [];
    
    // Build message content
    const isTask = type === 'task';
    const priorityText = isTask && details.priority ? `\nעדיפות: ${getPriorityLabel(details.priority)}` : '';
    const dateText = details.date ? `\nתאריך: ${details.date}` : '';
    const timeText = details.time ? `\nשעה: ${details.time}` : '';
    const locationText = details.location ? `\nמיקום: ${details.location}` : '';
    const descText = details.description ? `\nתיאור: ${details.description}` : '';
    
    const plainMessage = `${isTask ? '📋 משימה חדשה' : '📅 פגישה חדשה'}

${details.title}${priorityText}${dateText}${timeText}${locationText}${descText}

-- ArchFlow`;

    // Send Email
    if (channels.includes('email') && recipient.email) {
      try {
        const emailHtml = `
          <!DOCTYPE html>
          <html dir="rtl" lang="he">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <div style="background: linear-gradient(135deg, ${isTask ? '#3b82f6' : '#8b5cf6'} 0%, ${isTask ? '#1d4ed8' : '#6d28d9'} 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">${isTask ? '📋 משימה חדשה' : '📅 פגישה חדשה'}</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #666; font-size: 16px; margin-bottom: 20px;">שלום ${recipient.name},</p>
                <h2 style="color: #333; font-size: 24px; margin-bottom: 15px;">${details.title}</h2>
                ${details.description ? `<p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">${details.description}</p>` : ''}
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; margin-top: 20px;">
                  ${isTask && details.priority ? `<p style="margin: 5px 0; color: #333;"><strong>עדיפות:</strong> ${getPriorityLabel(details.priority)}</p>` : ''}
                  ${details.date ? `<p style="margin: 5px 0; color: #333;"><strong>תאריך:</strong> ${details.date}</p>` : ''}
                  ${details.time ? `<p style="margin: 5px 0; color: #333;"><strong>שעה:</strong> ${details.time}</p>` : ''}
                  ${details.location ? `<p style="margin: 5px 0; color: #333;"><strong>מיקום:</strong> ${details.location}</p>` : ''}
                </div>
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 14px; text-align: center;">
                    הודעה אוטומטית מ-ArchFlow
                  </p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "ArchFlow <onboarding@resend.dev>",
            to: [recipient.email],
            subject: `${isTask ? '📋 משימה חדשה' : '📅 פגישה חדשה'}: ${details.title}`,
            html: emailHtml,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to send email");
        }
        results.push({ channel: 'email', success: true });
        console.log("Email sent successfully:", data);
      } catch (error: any) {
        console.error("Email error:", error);
        results.push({ channel: 'email', success: false, error: error.message });
      }
    }

    // Send WhatsApp (via WhatsApp API link - opens in browser)
    if (channels.includes('whatsapp') && (recipient.whatsapp || recipient.phone)) {
      const phone = formatPhone(recipient.whatsapp || recipient.phone || '');
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(plainMessage)}`;
      results.push({ 
        channel: 'whatsapp', 
        success: true,
        error: whatsappUrl // Return URL for frontend to open
      });
      console.log("WhatsApp URL generated:", whatsappUrl);
    }

    // Send SMS (placeholder - requires SMS service integration)
    if (channels.includes('sms') && recipient.phone) {
      // For now, return info that SMS requires additional setup
      results.push({ 
        channel: 'sms', 
        success: false, 
        error: 'SMS service not configured. Please integrate with an SMS provider (Twilio, etc.)' 
      });
      console.log("SMS requested but not configured");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Notification processed for ${channels.length} channel(s)` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-task-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
