import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteClientRequest {
  clientId: string;
  clientEmail: string;
  clientName: string;
  temporaryPassword: string;
  portalUrl: string;
  businessName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { clientId, clientEmail, clientName, temporaryPassword, portalUrl, businessName = "ArchFlow" }: InviteClientRequest = await req.json();

    console.log(`Sending invitation email to ${clientEmail} for client ${clientName}`);

    // שליחת אימייל הזמנה
    const emailResponse = await resend.emails.send({
      from: `${businessName} <onboarding@resend.dev>`,
      to: [clientEmail],
      subject: `הוזמנת לפורטל הלקוחות של ${businessName}`,
      html: `
        <!DOCTYPE html>
        <html dir="rtl" lang="he">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                ברוכים הבאים לפורטל הלקוחות
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${businessName}
              </p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">
                שלום ${clientName},
              </p>
              
              <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 30px 0;">
                נוצר עבורך חשבון בפורטל הלקוחות שלנו. כאן תוכל/י לצפות בפרויקטים, להוריד קבצים, לשלוח הודעות ועוד.
              </p>
              
              <!-- Login Details Box -->
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 25px; margin: 0 0 30px 0; border-right: 4px solid #667eea;">
                <h3 style="color: #333; margin: 0 0 15px 0; font-size: 16px;">פרטי הכניסה שלך:</h3>
                
                <div style="margin-bottom: 12px;">
                  <span style="color: #777; font-size: 14px;">אימייל:</span>
                  <div style="color: #333; font-size: 16px; font-weight: 500; margin-top: 4px;">
                    ${clientEmail}
                  </div>
                </div>
                
                <div>
                  <span style="color: #777; font-size: 14px;">סיסמה זמנית:</span>
                  <div style="color: #333; font-size: 18px; font-weight: 600; margin-top: 4px; font-family: monospace; background: #fff; padding: 8px 12px; border-radius: 4px; border: 1px solid #e0e0e0;">
                    ${temporaryPassword}
                  </div>
                </div>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${portalUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  כניסה לפורטל
                </a>
              </div>
              
              <!-- Security Note -->
              <div style="background-color: #fff3cd; border-radius: 8px; padding: 15px; margin-top: 30px;">
                <p style="color: #856404; font-size: 14px; margin: 0; line-height: 1.5;">
                  🔐 <strong>המלצת אבטחה:</strong> מומלץ לשנות את הסיסמה בכניסה הראשונה לפורטל.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 25px 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #777; font-size: 14px; margin: 0;">
                אם יש לך שאלות, אנחנו כאן לעזור!
              </p>
              <p style="color: #999; font-size: 12px; margin: 15px 0 0 0;">
                © ${new Date().getFullYear()} ${businessName}. כל הזכויות שמורות.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in invite-client function:", error);
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
