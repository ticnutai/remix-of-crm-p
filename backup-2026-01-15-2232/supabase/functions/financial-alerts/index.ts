import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  status: string;
  due_date: string | null;
  client_name?: string;
}

interface User {
  id: string;
  email: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, sendEmail } = await req.json();

    console.log(`Processing financial alerts action: ${action}`);

    switch (action) {
      case "check_overdue": {
        // Get all overdue invoices
        const { data: invoices, error: invoicesError } = await supabase
          .from("invoices")
          .select(`
            id,
            invoice_number,
            client_id,
            amount,
            status,
            due_date,
            created_by,
            clients(name)
          `)
          .eq("status", "sent")
          .lt("due_date", new Date().toISOString().split("T")[0]);

        if (invoicesError) {
          console.error("Error fetching invoices:", invoicesError);
          throw invoicesError;
        }

        console.log(`Found ${invoices?.length || 0} overdue invoices`);

        let alertsCreated = 0;
        let emailsSent = 0;

        for (const invoice of invoices || []) {
          const clientName = (invoice.clients as any)?.name || "לקוח";
          
          // Update invoice status to overdue
          await supabase
            .from("invoices")
            .update({ status: "overdue" })
            .eq("id", invoice.id);

          // Check if alert already exists
          const { data: existingAlert } = await supabase
            .from("financial_alerts")
            .select("id")
            .eq("invoice_id", invoice.id)
            .eq("type", "overdue_invoice")
            .eq("status", "pending")
            .single();

          if (!existingAlert && invoice.created_by) {
            // Create new alert
            const { error: alertError } = await supabase
              .from("financial_alerts")
              .insert({
                user_id: invoice.created_by,
                type: "overdue_invoice",
                invoice_id: invoice.id,
                message: `חשבונית #${invoice.invoice_number} ללקוח ${clientName} בסך ₪${Math.round(invoice.amount).toLocaleString()} באיחור`,
                channel: sendEmail ? "both" : "browser",
                status: "pending",
              });

            if (!alertError) {
              alertsCreated++;
            }

            // Send email if enabled and Resend is configured
            if (sendEmail && resendApiKey) {
              try {
                const resend = new Resend(resendApiKey);
                
                // Get user email
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("email, full_name")
                  .eq("id", invoice.created_by)
                  .single();

                if (profile?.email) {
                  await resend.emails.send({
                    from: "Financial Alerts <alerts@resend.dev>",
                    to: [profile.email],
                    subject: `התראה: חשבונית באיחור #${invoice.invoice_number}`,
                    html: `
                      <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #dc2626;">⚠️ חשבונית באיחור</h2>
                        <p>שלום ${profile.full_name || ""},</p>
                        <p>חשבונית <strong>#${invoice.invoice_number}</strong> ללקוח <strong>${clientName}</strong> באיחור.</p>
                        <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                          <p style="margin: 5px 0;"><strong>סכום:</strong> ₪${Math.round(invoice.amount).toLocaleString()}</p>
                          <p style="margin: 5px 0;"><strong>תאריך פירעון:</strong> ${invoice.due_date}</p>
                        </div>
                        <p>מומלץ ליצור קשר עם הלקוח לגבי התשלום.</p>
                      </div>
                    `,
                  });
                  emailsSent++;
                }
              } catch (emailError) {
                console.error("Error sending email:", emailError);
              }
            }
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            overdueCount: invoices?.length || 0,
            alertsCreated,
            emailsSent,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_monthly_summary": {
        if (!userId) {
          throw new Error("userId is required for monthly summary");
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (!profile?.email) {
          throw new Error("User email not found");
        }

        // Get current month stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

        // Get paid invoices this month
        const { data: paidInvoices } = await supabase
          .from("invoices")
          .select("amount")
          .eq("status", "paid")
          .gte("paid_date", startOfMonth)
          .lte("paid_date", endOfMonth);

        const totalIncome = paidInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        // Get expenses this month
        const { data: expenses } = await supabase
          .from("expenses")
          .select("amount, is_recurring")
          .gte("expense_date", startOfMonth)
          .lte("expense_date", endOfMonth);

        const totalExpenses = expenses?.reduce((sum, exp) => {
          return sum + Number(exp.amount) * (exp.is_recurring ? 1 : 1);
        }, 0) || 0;

        // Get overdue count
        const { count: overdueCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "overdue");

        // Get pending count
        const { count: pendingCount } = await supabase
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent");

        const profit = totalIncome - totalExpenses;

        // Create alert
        await supabase.from("financial_alerts").insert({
          user_id: userId,
          type: "monthly_summary",
          message: `סיכום חודשי: הכנסות ₪${Math.round(totalIncome).toLocaleString()}, רווח ₪${Math.round(profit).toLocaleString()}`,
          channel: "browser",
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        // Send email if Resend is configured
        if (resendApiKey) {
          const resend = new Resend(resendApiKey);
          
          await resend.emails.send({
            from: "Financial Summary <alerts@resend.dev>",
            to: [profile.email],
            subject: `סיכום כספי חודשי - ${now.toLocaleDateString("he-IL", { month: "long", year: "numeric" })}`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">📊 סיכום כספי חודשי</h2>
                <p>שלום ${profile.full_name || ""},</p>
                <p>להלן סיכום הביצועים הכספיים לחודש הנוכחי:</p>
                
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #16a34a; margin-top: 0;">הכנסות</h3>
                  <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">₪${Math.round(totalIncome).toLocaleString()}</p>
                </div>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #dc2626; margin-top: 0;">הוצאות</h3>
                  <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">₪${Math.round(totalExpenses).toLocaleString()}</p>
                </div>
                
                <div style="background: ${profit >= 0 ? "#f0fdf4" : "#fef2f2"}; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: ${profit >= 0 ? "#16a34a" : "#dc2626"}; margin-top: 0;">רווח נקי</h3>
                  <p style="font-size: 24px; font-weight: bold; margin: 5px 0;">₪${Math.round(profit).toLocaleString()}</p>
                </div>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;">📋 חשבוניות ממתינות: <strong>${pendingCount || 0}</strong></p>
                  <p style="margin: 5px 0;">⚠️ חשבוניות באיחור: <strong style="color: ${(overdueCount || 0) > 0 ? "#dc2626" : "#16a34a"}">${overdueCount || 0}</strong></p>
                </div>
              </div>
            `,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            summary: {
              totalIncome,
              totalExpenses,
              profit,
              overdueCount,
              pendingCount,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send_collection_reminder": {
        const { invoiceId } = await req.json();
        
        if (!invoiceId) {
          throw new Error("invoiceId is required");
        }

        // Get invoice details
        const { data: invoice, error } = await supabase
          .from("invoices")
          .select(`
            *,
            clients(name, email, phone)
          `)
          .eq("id", invoiceId)
          .single();

        if (error || !invoice) {
          throw new Error("Invoice not found");
        }

        const client = invoice.clients as any;
        
        // Create alert
        await supabase.from("financial_alerts").insert({
          user_id: invoice.created_by,
          type: "collection_reminder",
          invoice_id: invoiceId,
          message: `נשלחה תזכורת גבייה ללקוח ${client?.name || "לא ידוע"} עבור חשבונית #${invoice.invoice_number}`,
          channel: "browser",
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        // Send email to client if available
        if (resendApiKey && client?.email) {
          const resend = new Resend(resendApiKey);
          
          await resend.emails.send({
            from: "Payment Reminder <reminders@resend.dev>",
            to: [client.email],
            subject: `תזכורת תשלום - חשבונית #${invoice.invoice_number}`,
            html: `
              <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>תזכורת תשלום</h2>
                <p>שלום ${client.name},</p>
                <p>ברצוננו להזכיר לך על חשבונית פתוחה:</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>מספר חשבונית:</strong> #${invoice.invoice_number}</p>
                  <p style="margin: 5px 0;"><strong>סכום:</strong> ₪${Math.round(invoice.amount).toLocaleString()}</p>
                  ${invoice.due_date ? `<p style="margin: 5px 0;"><strong>תאריך פירעון:</strong> ${invoice.due_date}</p>` : ""}
                </div>
                
                <p>נודה לטיפולך בהקדם.</p>
                <p>בברכה,<br>צוות הכספים</p>
              </div>
            `,
          });
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Collection reminder sent",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Error in financial-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
