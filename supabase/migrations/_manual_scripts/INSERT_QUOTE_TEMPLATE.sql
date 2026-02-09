-- ============================================================================
-- תבנית הצעת מחיר לשינוי תב"ע בסמכות מקומית
-- הרץ ב-Supabase SQL Editor
-- ============================================================================

INSERT INTO quote_templates (
    name,
    description,
    category,
    html_content,
    css_styles,
    primary_color,
    secondary_color,
    default_validity_days,
    is_default,
    is_active
) VALUES (
    'הצעת מחיר לשינוי תב"ע',
    'הצעת מחיר סטנדרטית לביצוע שינוי תב"ע בסמכות מקומית',
    'בנייה',
    -- HTML Content
    E'<div class="quote-page" dir="rtl">
    <!-- Header with Logo -->
    <div class="header text-center mb-6">
        {{company.logo}}
        <p class="text-sm text-gray-600">בס"ד</p>
    </div>

    <!-- Date -->
    <div class="text-left mb-6">
        <p class="text-lg highlight">{{today}}</p>
    </div>

    <!-- Title -->
    <div class="text-center mb-8">
        <h1 class="text-2xl font-bold">הנדון: <span class="underline">הצעת מחיר לביצוע שינוי תב"ע בסמכות מקומית</span></h1>
        <p class="text-lg mt-2 highlight">בגוש {{client.gush}} חלקה {{client.helka}} מגרשים {{client.migrash}}</p>
    </div>

    <!-- Parties Section -->
    <div class="mb-6">
        <h2 class="font-bold mb-3">בין</h2>
        <div class="party-info">
            <p>שם: <span class="font-bold highlight">{{client.name}}</span> ת.ז. {{client.id_number}}</p>
        </div>
        <p class="mt-2">(להלן "המזמינים")</p>
        
        <h2 class="font-bold mt-4 mb-3">לבין</h2>
        <div class="party-info">
            <p>{{company.name}}</p>
            <p>אדריכלות, עיצוב פנים וליווי פרויקטים</p>
        </div>
        <p class="mt-2">(להלן "עורכי הבקשה")</p>
    </div>

    <!-- Property Details -->
    <div class="property-details mb-6">
        <div class="detail-row">
            <span class="label">גוש:</span>
            <span class="value highlight">{{client.gush}}</span>
        </div>
        <div class="detail-row">
            <span class="label">חלקה:</span>
            <span class="value highlight">{{client.helka}}</span>
        </div>
        <div class="detail-row">
            <span class="label">מגרשים:</span>
            <span class="value highlight">{{client.migrash}}</span>
        </div>
        <div class="detail-row">
            <span class="label">התב"ע החלה:</span>
            <span class="value highlight">{{client.taba}}</span>
        </div>
        <div class="detail-row">
            <span class="label">תכנית בסמכות:</span>
            <span class="value">וועדה ממקומית</span>
        </div>
    </div>

    <!-- Plan Purpose -->
    <div class="mb-6">
        <h3 class="font-bold underline mb-2">מטרת התכנית:</h3>
        <p>הוספת יחידות דיור, שינוי קוו בניין, פיצול מגרשים, תוספת קומות, תוספת שטחים והכול כאמור לפי חוקי ותקנות התכנון והבניה והסכמת הוועדה והרשויות השונות בהתאם לסמכויות בעת הגשת תוכנית בסמכות מקומית.</p>
        <p class="font-bold mt-2">יודגש: ההגשה לשני המגרשים תהיה בבקשה אחת ולא תוגש בבקשות ובתוכניות נפרדות</p>
    </div>

    <!-- Work Scope -->
    <div class="mb-6">
        <h3 class="font-bold underline mb-3">העבודה תכלול:</h3>
        <ol class="numbered-list">
            <li>איסוף חומרים, בדיקתם וקיום פגישת פרה-רולינג ברשויות התכנוניות בוועדה וברשות מקרקעי ישראל (באם ידרש)</li>
            <li>גיבוש פרוגרמה עם מזמין העבודה</li>
            <li>פיתוח חלופה נבחרת לתוכנית בינוי</li>
            <li>הכנת תב"ע הכוללת תקנון, תשריט, נספח בינוי (באם ידרשו ע"י הרשויות השונות)</li>
            <li>הגשת התב"ע לדיון להפקדה בוועדה המקומית</li>
            <li>עריכת התיקונים הנדרשים ע"י הוועדה (באם ידרשו)</li>
            <li>הפקדת התוכנית כולל הגשה לוועדה המחוזית ע"פ סעיף 109 לחוק</li>
            <li>תיקונים בתוכנית לפי הנחיות הוועדה לאחר התנגדויות, עד למתן תוקף ופרסום ברשומות</li>
        </ol>
    </div>

    <!-- Pricing -->
    <div class="pricing-section mb-6">
        <h3 class="font-bold underline mb-3">שכר טרחה:</h3>
        <p class="price-main">שכר הטרחה לתכנון יעמוד על סך <span class="highlight font-bold">{{quote.total}}</span> ₪</p>
        
        <h4 class="font-bold mt-4 mb-2">שלבי התשלום:</h4>
        {{payment.schedule}}
    </div>

    <!-- Not Included -->
    <div class="mb-6">
        <h3 class="font-bold underline mb-3">שכר הטרחה אינו כולל:</h3>
        <ul class="bullet-list">
            <li>כל שינוי מצד המזמין לאחר אישורו וחתימתו על פרוגרמה מאושרת (לא מרשויות התכנון)</li>
            <li>הגשה נפרדת לכול תוכנית - באם יבוקש הגשה נפרדת יוסכם על שכר טרחה נוסף</li>
            <li>ביצוע תצ"ר, רישום הנכס אצל המפקחת ורשם המקרקעין וטיפול מול כל גורם קנייני/משפטי אחר</li>
            <li>שכר הטרחה אינו כולל מע"מ כחוק</li>
            <li>הדמיות, הדפסות, אגרות לרשויות השונות, פרסום, מדידות הפקת העתקות וצילומים - ישולם ישירות למכון העתקות</li>
            <li>תשלום ליועצים נוספים, באם ידרשו ע"י רשויות התכנון כגון: תנועה, ניקוז וכו'</li>
            <li>מעבר ל-3 חלופות תכנון לנספח בינוי, ישולם לפי שעת עבודה סך {{quote.hourly_rate}} ₪, למעט תיקונים הנדרשים ע"פ רשויות התכנון</li>
        </ul>
    </div>

    <!-- Notes -->
    <div class="mb-6">
        <h3 class="font-bold underline mb-3">הערות:</h3>
        <ul class="bullet-list">
            <li>יש להוסיף מע"מ כחוק לכל המחירים בהסכם זה</li>
            <li>ככל שיוחלט ע"י מי מהצדדים להפסיק את ההתקשרות, ישולם שכר הטרחה המלא עבור אותו שלב בו הופסקה ההתקשרות</li>
            <li>תוקף ה.מחיר {{quote.validity_days}} יום</li>
        </ul>
    </div>

    <!-- Signatures -->
    <div class="signatures mt-12 pt-8 border-t-2 border-gray-300">
        <p class="text-center font-bold mb-8">ובזאת באו הצדדים על החתום:</p>
        
        <div class="signature-grid">
            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="font-bold">חתימת לקוח</p>
            </div>
            
            <div class="signature-box">
                <div class="signature-line"></div>
                <p class="font-bold">תאריך</p>
            </div>
        </div>
    </div>
</div>',
    -- CSS Styles
    E'.quote-page {
    font-family: "David Libre", "Heebo", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.8;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
    background: white;
}

.quote-page h1 {
    color: #162C58;
}

.quote-page h2, .quote-page h3 {
    color: #162C58;
}

.highlight {
    background-color: #ffff00;
    padding: 0 4px;
}

.underline {
    text-decoration: underline;
}

.property-details {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
}

.detail-row {
    display: flex;
    margin-bottom: 8px;
}

.detail-row .label {
    font-weight: bold;
    width: 120px;
}

.numbered-list {
    list-style-type: decimal;
    padding-right: 24px;
}

.numbered-list li {
    margin-bottom: 8px;
}

.bullet-list {
    list-style-type: disc;
    padding-right: 24px;
}

.bullet-list li {
    margin-bottom: 8px;
}

.pricing-section {
    background: #e8f4fd;
    padding: 20px;
    border-radius: 8px;
    border: 2px solid #162C58;
}

.price-main {
    font-size: 18px;
}

.signature-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    text-align: center;
}

.signature-box {
    text-align: center;
}

.signature-line {
    height: 60px;
    border-bottom: 1px solid #333;
    margin-bottom: 8px;
}

@media print {
    .quote-page {
        padding: 20px;
        font-size: 12px;
    }
}',
    '#162C58', -- primary_color
    '#D4A843', -- secondary_color
    30, -- validity days
    false, -- is_default
    true -- is_active
)
ON CONFLICT DO NOTHING;

-- הודעת אישור
DO $$ 
BEGIN
    RAISE NOTICE '✅ התבנית "הצעת מחיר לשינוי תב"ע" נוצרה בהצלחה!';
END $$;
