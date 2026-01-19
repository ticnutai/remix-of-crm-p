import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_WEBHOOK_SECRET = Deno.env.get("RESEND_WEBHOOK_SECRET");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, svix-id, svix-timestamp, svix-signature",
};

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at?: string;
    bounce_type?: string;
    error_code?: string;
    error_message?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook signature (if secret is set)
    if (RESEND_WEBHOOK_SECRET) {
      const signature = req.headers.get('svix-signature');
      const timestamp = req.headers.get('svix-timestamp');
      const id = req.headers.get('svix-id');
      
      // TODO: Implement proper signature verification with Svix
      // For now, we'll just log if headers are present
      console.log("Webhook headers:", { signature: !!signature, timestamp, id });
    }

    const event: ResendWebhookEvent = await req.json();
    console.log("Received Resend webhook event:", event.type, event.data.email_id);

    const emailId = event.data.email_id;
    
    // Find email log by resend_id
    const { data: emailLog, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('resend_id', emailId)
      .single();

    if (fetchError || !emailLog) {
      console.error("Email log not found for resend_id:", emailId, fetchError);
      return new Response(
        JSON.stringify({ error: "Email log not found" }),
        { 
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders }
        }
      );
    }

    // Update email log based on event type
    const updates: any = {};
    const now = new Date().toISOString();

    switch (event.type) {
      case 'email.sent':
        updates.status = 'sent';
        updates.sent_at = event.created_at || now;
        break;

      case 'email.delivered':
        updates.status = 'delivered';
        updates.delivered_at = event.created_at || now;
        break;

      case 'email.delivery_delayed':
        updates.status = 'delayed';
        break;

      case 'email.bounced':
        updates.status = 'bounced';
        updates.bounced_at = event.created_at || now;
        updates.error_message = `Bounce: ${event.data.bounce_type || 'unknown'} - ${event.data.error_message || ''}`;
        break;

      case 'email.complained':
        updates.status = 'complained';
        updates.error_message = 'User marked as spam';
        break;

      case 'email.opened':
        updates.status = 'opened';
        if (!emailLog.opened_at) {
          updates.opened_at = event.created_at || now;
        }
        updates.open_count = (emailLog.open_count || 0) + 1;
        break;

      case 'email.clicked':
        updates.status = 'clicked';
        if (!emailLog.first_clicked_at) {
          updates.first_clicked_at = event.created_at || now;
        }
        updates.click_count = (emailLog.click_count || 0) + 1;
        break;

      default:
        console.log("Unhandled event type:", event.type);
        return new Response(
          JSON.stringify({ message: "Event type not handled" }),
          { 
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders }
          }
        );
    }

    // Update the email log
    const { error: updateError } = await supabase
      .from('email_logs')
      .update(updates)
      .eq('id', emailLog.id);

    if (updateError) {
      console.error("Error updating email log:", updateError);
      throw updateError;
    }

    console.log(`Updated email log ${emailLog.id} with status: ${updates.status}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Webhook processed successfully",
        event_type: event.type
      }),
      { 
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  } catch (error: any) {
    console.error("Error processing Resend webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
  }
};

serve(handler);
