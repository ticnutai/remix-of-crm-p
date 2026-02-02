import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const emailLogId = url.searchParams.get('id');
    const targetUrl = url.searchParams.get('url');
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (!emailLogId || !targetUrl) {
      return new Response("Missing parameters", { status: 400 });
    }

    console.log(`Tracking email click: ${emailLogId} -> ${targetUrl}`);

    // Get current email log
    const { data: emailLog, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .single();

    if (fetchError || !emailLog) {
      console.error("Email log not found:", fetchError);
      return Response.redirect(decodeURIComponent(targetUrl), 302);
    }

    // Update email log
    const updates: any = {
      status: emailLog.status === 'sent' ? 'clicked' : emailLog.status,
      click_count: (emailLog.click_count || 0) + 1
    };

    // Set first_clicked_at only on first click
    if (!emailLog.first_clicked_at) {
      updates.first_clicked_at = new Date().toISOString();
    }

    await supabase
      .from('email_logs')
      .update(updates)
      .eq('id', emailLogId);

    // Log the click
    await supabase
      .from('email_clicks')
      .insert({
        email_log_id: emailLogId,
        url: decodeURIComponent(targetUrl),
        ip_address: ipAddress,
        user_agent: userAgent
      });

    console.log(`Email clicked: ${emailLogId}, total clicks: ${updates.click_count}`);

    // Redirect to target URL
    return Response.redirect(decodeURIComponent(targetUrl), 302);
  } catch (error: any) {
    console.error("Error in track-email-click function:", error);
    
    // Try to redirect anyway
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url');
    if (targetUrl) {
      return Response.redirect(decodeURIComponent(targetUrl), 302);
    }
    
    return new Response("Error tracking click", { status: 500 });
  }
};

serve(handler);
