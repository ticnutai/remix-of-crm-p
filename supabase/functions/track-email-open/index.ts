import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 1x1 transparent GIF pixel
const TRACKING_PIXEL = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21, 0xF9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2C, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3B
]);

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const emailLogId = url.searchParams.get('id');
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    if (!emailLogId) {
      console.log("No email log ID provided");
      return new Response(TRACKING_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    console.log(`Tracking email open: ${emailLogId}`);

    // Get current email log
    const { data: emailLog, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', emailLogId)
      .single();

    if (fetchError || !emailLog) {
      console.error("Email log not found:", fetchError);
      return new Response(TRACKING_PIXEL, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Update email log
    const updates: any = {
      status: 'opened',
      open_count: (emailLog.open_count || 0) + 1
    };

    // Set opened_at only on first open
    if (!emailLog.opened_at) {
      updates.opened_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('email_logs')
      .update(updates)
      .eq('id', emailLogId);

    if (updateError) {
      console.error("Error updating email log:", updateError);
    } else {
      console.log(`Email opened: ${emailLogId}, total opens: ${updates.open_count}`);
    }

    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error: any) {
    console.error("Error in track-email-open function:", error);
    return new Response(TRACKING_PIXEL, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
};

serve(handler);
