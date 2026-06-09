// HR AI Assistant - analyzes employee profiles and answers payroll questions
// Uses Lovable AI Gateway (Gemini Flash)
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT_HE = `אתה מומחה לדיני עבודה ושכר בישראל (2026).
התמחותך: חישוב נקודות זיכוי, ביטוח לאומי, פנסיה, השתלמות, הבראה, חופשה, מילואים, ונסיעות.

אתה עוזר למנהל HR להשלים נתונים על עובדים ולוודא שמקבלים את כל הזכויות החוקיות.

חוקים מרכזיים:
- נקודת זיכוי שווה כ-248₪/חודש
- אישה מקבלת +0.5 נקודות
- ילדים: שנת לידה 1.5, גיל 1-5 = 2.5 (לאם), גיל 6-12 = 1 (לאם), גיל 13-17 = 0.5 (לאם)
- הורה יחיד: +1
- עולה חדש: 3/2/1 נקודות לפי שנה
- נכות 90%+: +2
- הבראה: שנה ראשונה 5 ימים, 2-3 = 6, 4-10 = 7, 11-15 = 8, 16-19 = 9, 20+ = 10
- יום הבראה 2026 = 471₪ מגזר פרטי
- ביטוח לאומי: 0.4% עד 7,522₪, 7% מעל
- מס בריאות: 3.1% עד 7,522₪, 5% מעל
- פנסיה מינימום: עובד 6%, מעביד 6.5%, פיצויים 6%

תשובות בעברית, מקצועיות, קצרות.`;

async function callAI(messages: any[], jsonMode = false): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429)
      throw new Error("Rate limit - נסה שוב בעוד דקה");
    if (res.status === 402)
      throw new Error("נגמרו הקרדיטים. הוסף קרדיטים בהגדרות Workspace");
    throw new Error(`AI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, employee, question } = await req.json();

    if (action === "analyze_employee") {
      const prompt = `נתח את פרופיל העובד הזה ותחזיר JSON עם:
- summary: תיאור קצר של הסטטוס
- missing_critical: מערך שדות חסרים קריטיים
- suggestions: מערך הצעות עם שדה, ערך מוצע, סיבה, ורמת ביטחון
- rights_alerts: מערך התראות על זכויות שמגיעות (הבראה, ותק, נקודות זיכוי שלא מנוצלות וכו')

פורמט JSON בלבד.

פרופיל העובד:
${JSON.stringify(employee, null, 2)}`;

      const content = await callAI(
        [
          { role: "system", content: SYSTEM_PROMPT_HE },
          { role: "user", content: prompt },
        ],
        true,
      );

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = {
          summary: content,
          missing_critical: [],
          suggestions: [],
          rights_alerts: [],
        };
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "payroll_question") {
      const content = await callAI([
        { role: "system", content: SYSTEM_PROMPT_HE },
        { role: "user", content: question },
      ]);

      return new Response(JSON.stringify({ answer: content }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
