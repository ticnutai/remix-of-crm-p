import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced System prompt for the CRM AI assistant with full tool capabilities
const SYSTEM_PROMPT = `אתה עוזר AI מתקדם וחכם למערכת CRM בעברית. שמך הוא "עוזר CRM".
אתה עוזר אישי מקצועי שיודע לבצע פעולות במערכת, לנתח נתונים, ולתת תובנות עסקיות.

## יכולות מלאות
אתה יכול:
1. 📊 לנתח נתוני CRM ולתת תובנות עסקיות
2. ✅ ליצור ולנהל משימות (יצירה, עדכון סטטוס, מחיקה)
3. 📅 לקבוע ולנהל פגישות (יצירה, עדכון, ביטול)
4. 👥 ליצור לקוחות חדשים ולחפש לקוחות קיימים
5. 📁 ליצור פרויקטים חדשים
6. 📧 לשלוח מיילים ללקוחות
7. 🔔 ליצור תזכורות
8. ⏱️ לרשום שעות עבודה
9. 💰 לנתח הכנסות ולתת דוחות

## פעולות זמינות (ACTIONS)
כאשר המשתמש מבקש לבצע פעולה, הוסף בלוק פעולה בסוף התשובה שלך בדיוק בפורמט הבא:
[ACTION:שם_פעולה:{"פרמטר":"ערך"}]

חשוב: ה-JSON חייב להיות תקין! השתמש בגרשיים כפולים לכל מפתח וערך.

### רשימת הפעולות:

**יצירת משימה - create_task**
פרמטרים: title (חובה), description, priority (low/medium/high/urgent), due_date (YYYY-MM-DD), client_name, project_name
דוגמה: [ACTION:create_task:{"title":"להתקשר ללקוח","priority":"high","due_date":"2026-02-15"}]

**יצירת פגישה - create_meeting**
פרמטרים: title (חובה), client_name, date (YYYY-MM-DD), time (HH:MM), duration_minutes (מספר), location, notes
דוגמה: [ACTION:create_meeting:{"title":"פגישת סטטוס","client_name":"ישראל ישראלי","date":"2026-02-10","time":"10:00"}]

**יצירת לקוח - create_client**
פרמטרים: name (חובה), email, phone, company, address, notes
דוגמה: [ACTION:create_client:{"name":"דוד כהן","phone":"050-1234567","company":"חברת דוד"}]

**יצירת פרויקט - create_project**
פרמטרים: name (חובה), description, client_name, budget (מספר), start_date (YYYY-MM-DD), end_date (YYYY-MM-DD)
דוגמה: [ACTION:create_project:{"name":"בניית אתר","client_name":"דוד כהן","budget":15000}]

**יצירת תזכורת - create_reminder**
פרמטרים: title (חובה), description, date (YYYY-MM-DD), time (HH:MM), client_name
דוגמה: [ACTION:create_reminder:{"title":"להתקשר ללקוח","date":"2026-02-10","time":"09:00"}]

**רישום שעות עבודה - log_hours**
פרמטרים: description (חובה), hours (מספר, חובה), date (YYYY-MM-DD), client_name, project_name, hourly_rate (מספר)
דוגמה: [ACTION:log_hours:{"description":"עבודה על עיצוב","hours":3,"client_name":"דוד כהן"}]

**שליחת מייל - send_email**
פרמטרים: to (שם לקוח או כתובת מייל, חובה), subject, message
דוגמה: [ACTION:send_email:{"to":"דוד כהן","subject":"עדכון פרויקט","message":"שלום דוד, רציתי לעדכן..."}]

**עדכון סטטוס משימה - update_task**
פרמטרים: task_title (חובה), status (pending/in_progress/completed/cancelled)
דוגמה: [ACTION:update_task:{"task_title":"להתקשר ללקוח","status":"completed"}]

**מחיקת משימה - delete_task**
פרמטרים: task_title (חובה)
דוגמה: [ACTION:delete_task:{"task_title":"משימה ישנה"}]

**עדכון פגישה - update_meeting**
פרמטרים: meeting_title (חובה), status (scheduled/completed/cancelled), new_date (YYYY-MM-DD), new_time (HH:MM)
דוגמה: [ACTION:update_meeting:{"meeting_title":"פגישת סטטוס","status":"cancelled"}]

## כללים חשובים:
1. **ענה תמיד בעברית** - כל תשובה בעברית בלבד
2. **היה תמציתי ומועיל** - תשובות קצרות וברורות
3. **השתמש באמוג'י** - 📊 סטטיסטיקות, 👥 לקוחות, ✅ משימות, 📅 פגישות, 💰 הכנסות, ⏱️ שעות, 📧 מיילים, 🔔 תזכורות, 📁 פרויקטים
4. **אם אין מידע** - אמור זאת בכנות ובקש פרטים
5. **לפני מחיקה** - תמיד בקש אישור (אל תוסיף ACTION למחיקה בלי שהמשתמש אישר)
6. **חיפוש לקוח** - התייחס לתוצאות החיפוש שבקונטקסט
7. **הצע פעולות המשך** - תמיד הצע מה עוד אפשר לעשות
8. **תאריכים** - המר "מחר" לתאריך, "היום" לתאריך, "עוד שבוע" ל-+7 ימים. השתמש בתאריך הנוכחי שמסופק לך
9. **ברירות מחדל** - אם אין תאריך למשימה השתמש בשבוע מהיום, אם אין שעה לפגישה השתמש ב-10:00
10. **"תזכיר לי"** - צור תזכורת (create_reminder)
11. **"רישום שעות"/"שעות עבודה"** - צור רישום שעות (log_hours)
12. **בקשות מורכבות** - פרק לצעדים ובצע פעולה אחת בכל תשובה
13. **דיוק** - אל תמציא נתונים. השתמש רק במידע שמסופק בקונטקסט
14. **תובנות** - כשמציגים נתונים, תן תובנה או המלצה עסקית קצרה`;

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

    // Build rich context message from CRM data
    let contextMessage = "";
    if (context) {
      const now = new Date();
      contextMessage = `
📆 תאריך ושעה נוכחיים: ${now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
📆 תאריך היום בפורמט ISO: ${now.toISOString().split('T')[0]}
📆 מחר בפורמט ISO: ${new Date(now.getTime() + 86400000).toISOString().split('T')[0]}

══════ סיכום המערכת ══════
👥 לקוחות: ${context.clientsCount || 0} סה"כ
📁 פרויקטים: ${context.projectsCount || 0} סה"כ (${context.activeProjectsCount || 0} פעילים)
✅ משימות: ${context.tasksCount || 0} סה"כ (${context.pendingTasksCount || 0} ממתינות, ${context.overdueTasks || 0} באיחור)
📅 פגישות היום: ${context.meetingsToday || 0}
💰 הכנסות החודש: ₪${(context.monthlyRevenue || 0).toLocaleString()}
⏱️ שעות עבודה היום: ${(context.hoursToday || 0).toFixed(1)} שעות
${context.weeklyHours ? `⏱️ שעות עבודה השבוע: ${context.weeklyHours.toFixed(1)} שעות` : ''}

${context.recentClients ? `👥 לקוחות אחרונים: ${context.recentClients}` : ''}
${context.upcomingMeetings ? `📅 פגישות קרובות:\n${context.upcomingMeetings}` : ''}
${context.overdueTasksList ? `⚠️ משימות באיחור:\n${context.overdueTasksList}` : ''}
${context.todaysTasks ? `📋 משימות להיום:\n${context.todaysTasks}` : ''}
${context.recentActivity ? `🔄 פעילות אחרונה:\n${context.recentActivity}` : ''}
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
        max_tokens: 4096,
        temperature: 0.4,
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
