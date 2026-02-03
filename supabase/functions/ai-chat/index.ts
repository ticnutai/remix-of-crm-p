import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// System prompt for the CRM AI assistant
const SYSTEM_PROMPT = `אתה עוזר AI חכם למערכת CRM בעברית. שמך הוא "עוזר CRM".

תפקידך:
- לעזור למשתמשים לקבל מידע על לקוחות, פרויקטים, משימות, פגישות, הכנסות ועוד
- לענות בעברית תמיד
- לספק מידע מדויק על סמך הנתונים שמסופקים לך
- להציע פעולות רלוונטיות
- כשמחפשים לקוח לפי שם - להשתמש בתוצאות החיפוש שמסופקות לך

כללים חשובים:
1. ענה תמיד בעברית
2. היה תמציתי ומועיל
3. השתמש באמוג'י לבהירות (📊 לסטטיסטיקות, 👥 ללקוחות, ✅ למשימות, 📅 לפגישות, 💰 להכנסות)
4. אם אין לך מידע, אמור זאת בכנות
5. הצע שאלות נוספות רלוונטיות
6. כשמחפשים לקוח - התייחס לתוצאות החיפוש ואם יש התאמות, הצג אותן למשתמש`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context message from CRM data
    let contextMessage = "";
    if (context) {
      contextMessage = `
הנה הנתונים הנוכחיים מהמערכת:

👥 לקוחות: ${context.clientsCount || 0} סה"כ
📋 פרויקטים: ${context.projectsCount || 0} סה"כ
✅ משימות: ${context.tasksCount || 0} (${context.overdueTasks || 0} באיחור)
📅 פגישות היום: ${context.meetingsToday || 0}
💰 הכנסות החודש: ₪${(context.monthlyRevenue || 0).toLocaleString()}
⏱️ שעות עבודה היום: ${(context.hoursToday || 0).toFixed(1)} שעות

${context.recentClients ? `לקוחות אחרונים: ${context.recentClients}` : ''}
${context.upcomingMeetings ? `פגישות קרובות: ${context.upcomingMeetings}` : ''}
`;

      // Add client search results if available
      if (context.clientSearch && context.searchedClients?.length > 0) {
        contextMessage += `
🔍 חיפוש לקוח: "${context.clientSearch}"
תוצאות חיפוש (${context.searchedClients.length} לקוחות מתאימים):
${context.searchedClients.map((c: any, i: number) => 
  `${i + 1}. **${c.name}**${c.company ? ` (${c.company})` : ''}${c.phone ? ` | טלפון: ${c.phone}` : ''}${c.email ? ` | מייל: ${c.email}` : ''}`
).join('\n')}

הערה: השתמש בתוצאות אלו לענות על שאלת המשתמש. אם הלקוח המבוקש נמצא ברשימה - ציין אותו בתשובתך.
`;
      } else if (context.clientSearch && (!context.searchedClients || context.searchedClients.length === 0)) {
        contextMessage += `
🔍 חיפוש לקוח: "${context.clientSearch}"
לא נמצאו לקוחות תואמים. יש להודיע למשתמש ולהציע לו לבדוק את כתיב השם או לנסות חיפוש אחר.
`;
      }
    }

    // Prepare messages for AI
    const aiMessages = [
      { role: "system", content: SYSTEM_PROMPT + (contextMessage ? `\n\n${contextMessage}` : "") },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call Lovable AI Gateway with streaming
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: true,
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "חרגת ממגבלת הבקשות, נסה שוב מאוחר יותר" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נדרש תשלום - אנא הוסף קרדיטים לחשבון" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "שגיאה בשירות ה-AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return streaming response
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "שגיאה לא ידועה";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
