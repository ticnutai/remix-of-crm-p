import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configuration
const MAX_RETRIES = 3;
const BATCH_SIZE = 50;
const RETRY_DELAYS = [60, 300, 900]; // 1min, 5min, 15min (in seconds)

async function calculateNextRetryTime(retryCount: number): Promise<string> {
  const delaySeconds = RETRY_DELAYS[Math.min(retryCount, RETRY_DELAYS.length - 1)];
  const nextRetry = new Date(Date.now() + delaySeconds * 1000);
  return nextRetry.toISOString();
}

async function sendEmail(emailData: any): Promise<{ success: boolean; error?: string; resendId?: string }> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-reminder-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        to: emailData.to_email,
        title: emailData.subject,
        message: emailData.html_content,
        templateId: emailData.template_id,
        userId: emailData.user_id,
        reminderId: emailData.reminder_id,
        variables: emailData.metadata?.variables || {},
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to send email' };
    }

    const result = await response.json();
    return { success: true, resendId: result.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Starting email queue processor...');

  try {
    const now = new Date().toISOString();
    
    // Get pending emails that are due to be sent
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', now)
      .lt('retry_count', MAX_RETRIES)
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${pendingEmails?.length || 0} pending emails to process`);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      retried: 0,
    };

    if (pendingEmails && pendingEmails.length > 0) {
      for (const email of pendingEmails) {
        // Mark as processing
        await supabase
          .from('email_queue')
          .update({ status: 'processing' })
          .eq('id', email.id);

        // Attempt to send
        const sendResult = await sendEmail(email);

        if (sendResult.success) {
          // Success - mark as sent
          await supabase
            .from('email_queue')
            .update({
              status: 'sent',
              processed_at: new Date().toISOString(),
              metadata: {
                ...email.metadata,
                resend_id: sendResult.resendId,
              },
            })
            .eq('id', email.id);

          results.succeeded++;
          console.log(`✅ Email ${email.id} sent successfully`);
        } else {
          // Failed - check if we should retry
          const newRetryCount = email.retry_count + 1;

          if (newRetryCount < email.max_retries) {
            // Schedule retry
            const nextRetryTime = await calculateNextRetryTime(newRetryCount);
            
            await supabase
              .from('email_queue')
              .update({
                status: 'pending',
                retry_count: newRetryCount,
                scheduled_at: nextRetryTime,
                metadata: {
                  ...email.metadata,
                  last_error: sendResult.error,
                  last_retry_at: new Date().toISOString(),
                },
              })
              .eq('id', email.id);

            results.retried++;
            console.log(`⚠️ Email ${email.id} failed, scheduled for retry #${newRetryCount} at ${nextRetryTime}`);
          } else {
            // Max retries reached - mark as failed
            await supabase
              .from('email_queue')
              .update({
                status: 'failed',
                processed_at: new Date().toISOString(),
                metadata: {
                  ...email.metadata,
                  error: sendResult.error,
                  final_retry_at: new Date().toISOString(),
                },
              })
              .eq('id', email.id);

            results.failed++;
            console.log(`❌ Email ${email.id} failed permanently after ${newRetryCount} attempts`);
          }
        }

        results.processed++;
      }
    }

    console.log('Queue processing complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} emails`,
        results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error processing email queue:', error);
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
