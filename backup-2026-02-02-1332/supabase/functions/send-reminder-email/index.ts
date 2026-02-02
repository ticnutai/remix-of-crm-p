import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ReminderEmailRequest {
  to: string;
  title: string;
  message?: string;
  userName?: string;
  templateId?: string;
  variables?: Record<string, any>;
  reminderId?: string;
  userId?: string;
  actionUrl?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    type?: string;
  }>;
  priority?: 'high' | 'normal' | 'low';
  tags?: string[];
}

// Simple template engine (supports {{variable}} and {{#if variable}}content{{/if}})
function renderTemplate(template: string, variables: Record<string, any>): string {
  let rendered = template;
  
  // Handle if blocks: {{#if variable}}content{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  rendered = rendered.replace(ifRegex, (match, varName, content) => {
    return variables[varName] ? content : '';
  });
  
  // Handle simple variables: {{variable}}
  const varRegex = /\{\{(\w+)\}\}/g;
  rendered = rendered.replace(varRegex, (match, varName) => {
    return variables[varName] !== undefined ? String(variables[varName]) : '';
  });
  
  return rendered;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      title, 
      message, 
      userName, 
      templateId, 
      variables = {},
      reminderId,
      userId,
      actionUrl,
      attachments,
      priority = 'normal',
      tags = []
    }: ReminderEmailRequest = await req.json();

    console.log("Sending reminder email to:", to, "with title:", title);

    // Merge default variables with provided ones
    const templateVars = {
      userName,
      title,
      message,
      actionUrl,
      ...variables
    };

    let htmlContent = '';
    let textContent = '';
    let subject = `⏰ תזכורת: ${title}`;

    // If template ID provided, fetch and use template
    if (templateId) {
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (templateError) {
        console.error("Error fetching template:", templateError);
        throw new Error("Template not found");
      }

      if (template) {
        subject = renderTemplate(template.subject, templateVars);
        htmlContent = renderTemplate(template.html_content, templateVars);
        textContent = template.text_content ? renderTemplate(template.text_content, templateVars) : '';
      }
    } else {
      // Use default template
      htmlContent = `
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
              ${userName ? `<p style="color: #666; font-size: 16px; margin-bottom: 20px;">שלום ${userName},</p>` : ''}
              <h2 style="color: #333; font-size: 24px; margin-bottom: 15px;">${title}</h2>
              ${message ? `<p style="color: #666; font-size: 16px; line-height: 1.6;">${message}</p>` : ''}
              ${actionUrl ? `
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${actionUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    פתח את המערכת
                  </a>
                </div>
              ` : ''}
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 14px; text-align: center;">
                  זוהי תזכורת אוטומטית מ-ArchFlow
                </p>
              </div>
            </div>
          </div>
          <!-- Tracking Pixel -->
          ${reminderId ? `<img src="${SUPABASE_URL}/functions/v1/track-email-open?id=${reminderId}" width="1" height="1" alt="" />` : ''}
        </body>
        </html>
      `;
      
      textContent = `
שלום ${userName || ''},

תזכורת: ${title}

${message || ''}

${actionUrl ? `קישור: ${actionUrl}` : ''}

זוהי תזכורת אוטומטית מ-ArchFlow
      `.trim();
    }

    // Prepare email payload
    const emailPayload: any = {
      from: "ArchFlow <onboarding@resend.dev>",
      to: [to],
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'type', value: 'reminder' },
        ...tags.map(tag => ({ name: 'custom', value: tag }))
      ]
    };

    // Add priority header
    if (priority === 'high') {
      emailPayload.headers = {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      };
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      emailPayload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        type: att.type || 'application/octet-stream'
      }));
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend API error:", data);
      
      // Log failed email
      if (userId) {
        await supabase.from('email_logs').insert({
          to_email: to,
          from_email: emailPayload.from,
          subject,
          html_content: htmlContent,
          status: 'failed',
          error_message: data.message || 'Unknown error',
          reminder_id: reminderId,
          template_id: templateId,
          user_id: userId,
          metadata: { priority, tags }
        });
      }
      
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    // Log successful email
    if (userId) {
      await supabase.from('email_logs').insert({
        to_email: to,
        from_email: emailPayload.from,
        subject,
        html_content: htmlContent,
        resend_id: data.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
        reminder_id: reminderId,
        template_id: templateId,
        user_id: userId,
        metadata: { priority, tags, variables: templateVars }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reminder-email function:", error);
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
