-- ============================================================================
-- תבנית חוזה להוצאת היתר בניה
-- הרץ ב-Supabase SQL Editor
-- ============================================================================

-- בדיקה אם הטבלה קיימת
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'contract_templates') THEN
        RAISE NOTICE 'הטבלה contract_templates לא קיימת! הרץ קודם את RUN_THIS_IN_SUPABASE.sql';
    END IF;
END $$;

-- הכנסת התבנית
INSERT INTO contract_templates (
    name,
    description,
    category,
    html_content,
    css_styles,
    primary_color,
    secondary_color,
    variables,
    default_terms_and_conditions,
    default_payment_terms,
    default_payment_schedule,
    default_duration_days,
    is_default,
    is_active
) VALUES (
    'חוזה להוצאת היתר בניה',
    'חוזה סטנדרטי לשירותי אדריכלות והוצאת היתר בניה - כולל שלבי תכנון, רישוי וביצוע',
    'בנייה',
    -- HTML Content
    E'<div class="contract-page" dir="rtl">
    <!-- Header with Date -->
    <div class="text-center mb-8">
        <p class="text-lg font-bold">{{today}}</p>
    </div>

    <!-- Title -->
    <div class="text-center mb-8">
        <h1 class="text-2xl font-bold">חוזה להוצאת היתר בניה</h1>
        <p class="text-lg mt-2">בגוש {{client.gush}} חלקה {{client.helka}} מגרש {{client.migrash}}</p>
        <p class="text-lg">{{contract.location}} – משפחת {{client.name}}</p>
    </div>

    <!-- Parties Section -->
    <div class="mb-8">
        <h2 class="text-xl font-bold mb-4">בין</h2>
        
        <!-- מזמינים -->
        <div class="orderers-section mb-4">
            {{parties.orderers}}
        </div>
        <p class="font-bold">(להלן "המזמינים")</p>
        
        <h2 class="text-xl font-bold my-4">לבין</h2>
        
        <!-- עורכי הבקשה -->
        <div class="provider-section">
            <p>{{company.name}}</p>
            <p>אדריכלות, עיצוב פנים וליווי פרויקטים</p>
        </div>
        <p class="font-bold">(להלן "עורכי הבקשה")</p>
    </div>

    <!-- Preamble -->
    <div class="mb-8">
        <p class="mb-4">הואיל והמזמינים מעוניינים להגיש בקשה להיתר לבניית מבנה צמוד קרקע {{contract.units_count}} יחידות, במגרש בעל זכויות ליחידות דיור (ע"פ תב"ע {{client.taba}}) בגוש {{client.gush}} חלקה {{client.helka}} מגרש {{client.migrash}}.</p>
        <p class="mb-4">הואיל והמזמינים מעוניינים למסור לעורכי הבקשה את ביצוע השירותים האדריכליים והשירותים הנוספים המפורטים להלן בהסכם זה.</p>
        <p class="mb-4">הואיל ועורכי הבקשה מסכימים לקבל על עצמם ביצוע השירותים האלה.</p>
        <p class="font-bold">לפיכך הוסכם והותנה בין הצדדים כדלקמן:</p>
    </div>

    <!-- Section 1: Introduction -->
    <div class="mb-6">
        <h3 class="text-lg font-bold mb-2">1. תוכן המבוא</h3>
        <ol class="list-decimal pr-8">
            <li>המבוא להסכם זה מהווה חלק עיקרי ובלתי נפרד הימנו.</li>
        </ol>
    </div>

    <!-- Section 2: Scope of Services -->
    <div class="mb-6">
        <h3 class="text-lg font-bold mb-2">2. מהות ההתקשרות</h3>
        <ol class="list-decimal pr-8">
            <li>המזמינים מוסרים בזאת לעורכי הבקשה, ועורכי הבקשה מקבלים על עצמם לבצע את השירותים האדריכליים והאחרים המפורטים להלן לצורך תכנון הבית.</li>
            <li>השירותים האדריכליים יכללו:</li>
        </ol>
    </div>

    <!-- Stage 1: Feasibility -->
    <div class="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 class="font-bold text-primary mb-3">שלב ראשון:</h4>
        
        <h5 class="font-bold mb-2">בדיקת היתכנות</h5>
        <ol class="list-decimal pr-8 mb-4">
            <li>בירור תוכניות בנין עיר (תב"ע) החלות על המגרש/דירה, בדיקת סטטוס המגרש מבחינת היתרי הבניה, והשוואתם למצב הקיים (במידה וישנם), גיבוש זכויות הבניה והאופציות השונות האפשריות במגרש/דירה.</li>
            <li>הזמנת תיק מידע מהוועדה לתכנון ובניה לצורך רישוי ותכנון.</li>
        </ol>
        
        <h5 class="font-bold mb-2">תכנון רעיוני</h5>
        <ol class="list-decimal pr-8 mb-4">
            <li>עורכי הבקשה יכינו פרוגרמה מפורטת עם המזמינים, ויוכנו עד 4 חלופות למזמינים. התוכניות תכלולנה חלוקת החללים, תוכנית העמדת ריהוט, העמדת אביזרים סניטריים.</li>
            <li>על גבי החלופה שנבחרה ע"י המזמינים ותוגש לוועדה לקבלת היתר, יתאפשרו שינויים והתאמות על פי דרישות הוועדה ובתיאום עם היועצים השונים.</li>
        </ol>
        
        <h5 class="font-bold mb-2">רישוי</h5>
        <ol class="list-decimal pr-8">
            <li>עורכי הבקשה יערכו ויגישו בקשה להיתר לוועדה לתכנון ובניה (הכוללת הקלות במידת הצורך ובהתאם למותר), ידאגו לקבלתו של ההיתר, יתאמו בין היועצים השונים הנדרשים ע"י הוועדה.</li>
            <li>וישתתפו בפגישות ודיונים עם המוסדות המאשרים לצורך קידום קבלת היתר בניה.</li>
            <li>כעורכי הבקשה יחתימו עפ"י דרישת הוועדה את פקע"ר, והרשויות השונות לרבות רמ"י וכל רשות נדרשת לשם קבלת היתר הבניה (למעט החתמת שכנים וחברי וועד/אגודה).</li>
        </ol>
    </div>

    <!-- Stage 2: Construction -->
    <div class="mb-6 bg-gray-50 p-4 rounded-lg">
        <h4 class="font-bold text-primary mb-3">שלב שני: בניה</h4>
        <p class="mb-2">עורכי הבקשה יערכו תוכניות ביצוע (תואמות להיתר הבניה וללא חריגות) הכוללות:</p>
        <ol class="list-decimal pr-8">
            <li>תוכניות עבודה אדריכליות מפורטות: תכנית הקומות, חתכים, חזיתות, תוכנית העמדת הבניין במגרש, תכנית מדרגות.</li>
            <li>פיתוח השטח, גדרות, שבילי כניסה וחניה, מפלסים, ריצוף חוץ צמחייה, גדרות, פרגולה וסוככים, מיקום בלוני גז. (בתיאום עם יועצים)</li>
            <li>פגישה עם קבלן המבצע להסברת התוכנית העבודה ומתן הנחיות טרם ביצוע.</li>
            <li>פיקוח עליון לצורכי רישוי בלבד: ביקורים באתר לפני יציקת תקרות ורצפה ראשונה, עם בניית שורה אבן ראשונה, בהגעה לגובה ספי חלונות וכן במקרים בהם דרושה התערבותו של המתכנן לפתרון בעיות העומדות על הפרק.</li>
        </ol>
    </div>

    <!-- General Terms -->
    <div class="mb-6">
        <h4 class="font-bold mb-3">כללי</h4>
        <ol class="list-decimal pr-8">
            <li class="mb-2">המזמינים יזמינו על חשבונם, לפי הצורך ובהתייעצות עם עורכי הבקשה, את השירותים והיועצים הנדרשים לצורך קבלת היתר ולצורך בניית המבנה לרבות: מודד, יועץ קרקע, מהנדס קונסטרוקטור, יועץ בטיחות, יועץ סניטרי, יועץ אקוסטי, מהנדס חשמל, אדריכל נוף, יועץ בריכות, יועץ חשמל, יועץ סניטריה וניקוז, מכון התקנים וכל דרישה שתבוקש ע"י הרשויות השונות. עורכי הבקשה יהיו האחראים על תיאום התוכניות של היועצים שיתקבלו והתאמתן לתוכנית הבניה ולתוכניות הביצוע.</li>
            <li class="mb-2">אין לעורכי הבקשה אחריות בנוגע לתשלומים לוועדה לתכנון ובניה לרבות היטלי השבחה אגרות בניה וכו'', וכן לתשלומים לרמ"י, לאגודה לוועד ולשאר רשויות.</li>
            <li class="mb-2">המזמינים ידאגו למילוי הוראות אשר בתוכנית העבודה ולבטיחות באתר בהתאם להוראות החוק ודרישות הוועדה המקומית בין אם באמצעות מנהל עבודה, מפקח או כל אמצעי אחר, ובלבד שימולאו הוראות אלו. מומלץ שישכרו שירותיהם של קבלנים רשומים וכן מפקח בניה לפיקוח צמוד.</li>
        </ol>
    </div>

    <!-- Payment Section -->
    <div class="mb-6 border-2 border-primary p-4 rounded-lg">
        <h3 class="text-lg font-bold mb-4">תשלומים ושכר טרחה</h3>
        <ol class="list-decimal pr-8">
            <li class="mb-2">שכר טרחה אינו כולל צילומי תוכניות ופלוטים, שליחויות ע"י מכון הצילום ומשלוחי דואר: המזמינים יפרעו את החיובים אשר יוגשו להם על ידי מכון הצילום במהלך הפרויקט ישירות מול מכון הצילום.</li>
            <li class="mb-2">שכר טרחה אינו כולל הוצאות וטיפול בהליך פרסום לצורך הגשת בקשה בהקלה.</li>
            <li class="mb-2 font-bold text-lg">שכר טרחה עבור מכלול השירותים ע"פ הסכם זה: {{contract.value}} ₪</li>
            <li class="mb-2">לכל תכנון של יחידת דיור נוספת (תוכנית אופציונלית עתידית) יתווסף שכר טרחה על סך {{contract.extra_unit_price}} ₪ ליחידה.</li>
            <li class="mb-2">יש להוסיף מע"מ כחוק על כל המחירים המצויינים.</li>
        </ol>
        
        <h4 class="font-bold mt-4 mb-2">התשלום יתבצע ע"פ השלבים הבאים:</h4>
        {{payment.schedule}}
    </div>

    <!-- Notes Section -->
    <div class="mb-6">
        <h3 class="text-lg font-bold mb-4">הערות:</h3>
        <ol class="list-decimal pr-8">
            <li class="mb-2">במקרה של ביטול הסכם זה: הסכום בפרק התשלומים ושכ"ט יוחזרו למזמינים ובלבד וטרם החלה בדיקת ההיתכנות ופגישות להכנת הפרוגרמה.</li>
            <li class="mb-2">היה והמזמינים הפסיקו את ההתקשרות והעבודה עם עורכי הבקשה, יהא על המזמינים לשלם לעורכי הבקשה עבור כל השלבים שהוכנו על ידם עד מועד הפסקת העבודה וכן עבור השלב שנמצא בתהליך הכנה ע"י עורכי הבקשה.</li>
            <li class="mb-2">היה ועורכי הבקשה החליטו על הפסקת התקשרות מול המזמינים (מטעמים של חילוקי דעות ואו אי עמידה בחוזה זה) יהא על המזמינים לשלם לעורכי הבקשה על כל השלבים שהוכנו על ידם עד מועד הפסקת העבודה.</li>
            <li class="mb-2">הסכם זה אינו כולל תכניות שינוי תב"ע מקומית / מחוזית תשריט חלוקה (פרצלציה) רישום בית משותף.</li>
            <li class="mb-2">לא יתוכננו חללים שאינם כלולים בהיתר והחורגים מהתוכניות המאושרות במוסדות התכנון.</li>
            <li class="mb-2">באם יופסק הליך ההיתר בגין מזמיני הבקשה לתקופת זמן שמעבר לחצי שנה, עורכי הבקשה לא מחויבים ע"פ חוזה זה להמשיך בעבודתם ולהשלים את ההליך ההיתרי.</li>
            <li class="mb-2">באם יאושר הארכת תוקף של הוראת השעה תוספת יחידת דיור - סעיף 147 לחוק (פיצול צמודי קרקע), אשר יצריך הגשה ותכנון מחדש, שכר הטרחה יתומחר על סך 50% מעלות ההיתר הראשוני.</li>
        </ol>
    </div>

    <!-- Additional Payment Terms -->
    <div class="mb-6 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <h3 class="text-lg font-bold mb-4">תוספת תשלום תחול במקרים שלהלן:</h3>
        <ol class="list-decimal pr-8">
            <li class="mb-1">כל שינוי, לדרישת המזמינים בפרוגרמה מאושרת וחתומה, משלב תחילת עבודת התכנון ואילך.</li>
            <li class="mb-1">כל שינוי בחלופה מאושרת וחתומה ע"י המזמינים.</li>
            <li class="mb-1">כל שינוי בתוכניות עבודה.</li>
            <li class="mb-1">עבור תוכניות ופרטי נגרות (מטבח, דלפקים, ח.ארונות נישות גבס) - מוסכם תוספת תשלום (אופציה)</li>
            <li class="mb-1">עבור הכנת כתב כמויות לקבלן - מוסכם על תוספת תשלום (אופציה)</li>
            <li class="mb-1">ישנה אפשרות להכנת הדמיה בתוספת תשלום.</li>
            <li class="mb-1">כל ש"ע בגין העבודות הנוספות הינה {{contract.hourly_rate}} ₪ פלוס מע"מ.</li>
        </ol>
    </div>

    <!-- Important Notice -->
    <div class="mb-6 bg-red-50 p-4 rounded-lg border-2 border-red-300">
        <h3 class="text-lg font-bold mb-2 text-red-700">יודגש:</h3>
        <ul class="list-disc pr-8">
            <li class="mb-2"><strong>המחיר המוצע בחוזה זה, מותנה בהצטרפות השכן באותו המגרש להגשת היתר לביתו. באם ההגשה תהיה רק למזמיני העבודה - תהיה תוספת תשלום בסך {{contract.single_submission_fee}} ₪ פלוס מע"מ.</strong></li>
            <li><strong>הצטרפות לאותה בקשה תהיה עד שלושה חודשים מיום החתימה על הסכם זה, לאחר מועד זה התשלום יעלה בחמשת אלפים ש"ח.</strong></li>
        </ul>
    </div>

    <!-- Timeline Section -->
    <div class="mb-6">
        <h3 class="text-lg font-bold mb-4">לוחות הזמנים:</h3>
        <p class="mb-2 italic">למעט עיכוב הנובע מסיבות שאינן תלויות באף אחד מהצדדים ו/או מכח עליון</p>
        <ol class="list-decimal pr-8">
            <li class="mb-1">בדיקת היתכנות מול הרשויות השונות לגבי זכויות הבניה (תיק מידע) - 35 ימי עבודה מיום קבלת מפת המדידה</li>
            <li class="mb-1">מסירת סקיצה ראשונה למזמין - 25 ימי עבודה מאישור וחתימת המזמין על הפרוגרמה</li>
            <li class="mb-1">עיבוד החלופה הנבחרת - 12 ימי עבודה לאחר משוב המזמין</li>
            <li class="mb-1">הגשת תוכניות לרשויות - 21 ימי עבודה מאישורו הסופי של המזמין</li>
            <li class="mb-1">הכנת תוכנית עבודה לביצוע - 45 ימי עבודה מרגע קבלת ההיתר</li>
        </ol>
    </div>

    <!-- Miscellaneous -->
    <div class="mb-8">
        <h3 class="text-lg font-bold mb-2">שונות:</h3>
        <p>לעורכי הבקשה שמורים זכויות יוצרים על התכנון. הוכחת תשלום כנגד חשבונית מס. תוקף הצעת המחיר 30 יום.</p>
    </div>

    <!-- Signatures -->
    <div class="mt-12 pt-8 border-t-2 border-gray-300">
        <p class="text-center font-bold mb-8">ובזאת באו הצדדים על החתום:</p>
        
        <div class="grid grid-cols-2 gap-8">
            <!-- Client Signatures -->
            <div class="text-center">
                {{signatures.orderers}}
                <div class="border-t border-gray-400 pt-2 mt-4">
                    <p class="font-bold">חתימת לקוח</p>
                </div>
            </div>
            
            <!-- Provider Signature -->
            <div class="text-center">
                <div class="h-24 border-b border-dashed border-gray-400 mb-4"></div>
                <p class="font-bold">חתימת עורכי הבקשה</p>
            </div>
        </div>
        
        <div class="text-center mt-8">
            <p>תאריך: {{today}}</p>
        </div>
    </div>
</div>',
    -- CSS Styles
    E'.contract-page {
    font-family: "David Libre", "Heebo", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.8;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
    background: white;
}

.contract-page h1 {
    color: #162C58;
    border-bottom: 2px solid #D4A843;
    padding-bottom: 10px;
}

.contract-page h2, .contract-page h3 {
    color: #162C58;
}

.contract-page h4 {
    color: #1E3A6E;
}

.text-primary {
    color: #162C58;
}

.bg-gray-50 {
    background-color: #f9fafb;
}

.bg-yellow-50 {
    background-color: #fffbeb;
}

.bg-red-50 {
    background-color: #fef2f2;
}

.border-yellow-200 {
    border-color: #fde68a;
}

.border-red-300 {
    border-color: #fca5a5;
}

.text-red-700 {
    color: #b91c1c;
}

.border-primary {
    border-color: #162C58;
}

.list-decimal {
    list-style-type: decimal;
}

.list-disc {
    list-style-type: disc;
}

.orderers-section p {
    margin-bottom: 8px;
    padding: 8px;
    background: #f3f4f6;
    border-radius: 4px;
}

@media print {
    .contract-page {
        padding: 20px;
        font-size: 12px;
    }
}',
    '#162C58', -- primary_color (navy)
    '#D4A843', -- secondary_color (gold)
    -- Variables array
    ARRAY[
        'client.name', 'client.phone', 'client.email', 'client.address', 
        'client.id_number', 'client.gush', 'client.helka', 'client.migrash', 'client.taba',
        'parties.orderers', 'signatures.orderers',
        'contract.value', 'contract.location', 'contract.units_count',
        'contract.extra_unit_price', 'contract.hourly_rate', 'contract.single_submission_fee',
        'payment.schedule', 'company.name', 'today'
    ],
    -- Terms and conditions
    E'1. המבוא להסכם זה מהווה חלק עיקרי ובלתי נפרד הימנו.
2. אין לעורכי הבקשה אחריות בנוגע לתשלומים לוועדה לתכנון ובניה.
3. לעורכי הבקשה שמורים זכויות יוצרים על התכנון.
4. תוקף הצעת המחיר 30 יום.',
    -- Payment terms
    E'יש להוסיף מע"מ כחוק על כל המחירים המצויינים.',
    -- Payment schedule (JSONB)
    '[
        {"description": "עם חתימת חוזה", "percentage": 25, "days_offset": 0},
        {"description": "עם חתימת הלקוח על תכנית הגשה לרשויות", "percentage": 30, "days_offset": 30},
        {"description": "בעת קבלת אישור מהוועדה (היתר בתנאים)", "percentage": 30, "days_offset": 90},
        {"description": "בעת קבלת טופס היתר לתחילת עבודות", "percentage": 15, "days_offset": 120}
    ]'::jsonb,
    365, -- default_duration_days
    true, -- is_default
    true -- is_active
)
ON CONFLICT DO NOTHING;

-- הודעת אישור
DO $$ 
BEGIN
    RAISE NOTICE '✅ התבנית "חוזה להוצאת היתר בניה" נוצרה בהצלחה!';
END $$;
