-- ייבוא 3 טבלאות (spreadsheets) מהגיבוי
-- 1. שינוי תב"ע (16 שורות, 30 עמודות)
-- 2. בקשה להעברת זכויות (12 שורות, 33 עמודות)  
-- 3. מנהל - בקשה לרכישת זכויות (26 שורות, 22 עמודות)

DO $$
DECLARE
    v_user_id UUID;
    v_table_id UUID;
    v_client_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    -- ===========================================
    -- טבלה 1: שינוי תב"ע
    -- ===========================================
    
    -- מציאת לקוח הולצמן
    SELECT id INTO v_client_id FROM clients WHERE name ILIKE '%הולצמן%' LIMIT 1;
    
    INSERT INTO custom_tables (name, display_name, icon, description, columns, created_by, created_at)
    VALUES (
        'shinui_taba',
        'שינוי תב''ע',
        'Table',
        'טבלת מעקב שינוי תב''ע',
        '[
            {"id": "col_1766320778156", "name": "client_name", "displayName": "שם לקוח:", "type": "text"},
            {"id": "col_1766321158190", "name": "plan_status", "displayName": "סטטוס תכנית:", "type": "text"},
            {"id": "col_1766321455078", "name": "moshav_signature", "displayName": "חתימת וועד המושב", "type": "text"},
            {"id": "col_1766948658397", "name": "ownership_docs_rental", "displayName": "מסמכי בעלויות חוזה חכירה", "type": "text"},
            {"id": "col_1766948991405", "name": "ownership_docs_sale", "displayName": "מסמכי בעלויות- הסכם מכר", "type": "text"},
            {"id": "col_1766321278971", "name": "rights_approval", "displayName": "אישור זכויות", "type": "text"},
            {"id": "col_1766321473912", "name": "rami_signature", "displayName": "חתימת רמ''י", "type": "text"},
            {"id": "col_1766321511084", "name": "conditions_form", "displayName": "טופס תנאי סף", "type": "text"},
            {"id": "col_1766321528053", "name": "editor_declaration", "displayName": "הצהרת עורך ראשי", "type": "text"},
            {"id": "col_1766321544912", "name": "submitters_form", "displayName": "טופס מגישי התכנית", "type": "text"},
            {"id": "col_1766321494770", "name": "signed_declarations", "displayName": "הצהרות חתומות", "type": "text"},
            {"id": "col_1766321564275", "name": "form_b1", "displayName": "טופס ב1 - אם לא הבעלים", "type": "text"},
            {"id": "col_1766321582773", "name": "regulations", "displayName": "הוראות -תקנון", "type": "text"},
            {"id": "col_1766321602777", "name": "section_1_6", "displayName": "סעיף  1.6", "type": "text"},
            {"id": "col_1766321614650", "name": "section_1_8", "displayName": "סעיף 1.8", "type": "text"},
            {"id": "col_1766321624546", "name": "section_2", "displayName": "סעיף 2", "type": "text"},
            {"id": "col_1766321637596", "name": "section_3_2", "displayName": "סעיף 3.2", "type": "text"},
            {"id": "col_1766321651097", "name": "section_4", "displayName": "סעיף  4", "type": "text"},
            {"id": "col_1766321656574", "name": "section_5", "displayName": "סעיף 5", "type": "text"},
            {"id": "col_1766321662246", "name": "section_6", "displayName": "סעיף 6", "type": "text"},
            {"id": "col_1766321672503", "name": "section_7", "displayName": "סעיף 7", "type": "text"},
            {"id": "col_1766321716894", "name": "proposed_state", "displayName": "מצב מוצע", "type": "text"},
            {"id": "col_1766321723423", "name": "current_state", "displayName": "מצב קיים", "type": "text"},
            {"id": "col_1766321750747", "name": "building_appendix", "displayName": "נספח בינוי/ העמדה", "type": "text"},
            {"id": "col_1766321765645", "name": "indemnity_letter", "displayName": "כתב שיפוי", "type": "text"},
            {"id": "col_1766321796597", "name": "version_change_report", "displayName": "דוח שינוי בין גרסאות", "type": "text"},
            {"id": "col_1767115229378", "name": "price_quote", "displayName": "ה.מחיר", "type": "text"},
            {"id": "col_1767190566283", "name": "payments_to_clients", "displayName": "תשלומים ששילמנו ללקוחות", "type": "text"}
        ]'::jsonb,
        v_user_id,
        '2025-12-21T12:39:43.844Z'::timestamptz
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_table_id;
    
    -- אם הטבלה נוצרה, נוסיף את השורות
    IF v_table_id IS NOT NULL THEN
        -- שורה 1: הולצמן
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "הולצמן", "plan_status": "קיים", "moshav_signature": "קיים", "rami_signature": "חסר", "editor_declaration": "קיים", "submitters_form": "קיים", "form_b1": "לא רלוונטי", "section_1_6": "קיים", "section_1_8": "קיים", "section_2": "קיים", "section_3_2": "קיים", "section_4": "קיים", "section_5": "קיים", "section_6": "קיים", "section_7": "קיים", "proposed_state": "קיים", "current_state": "קיים", "building_appendix": "קיים", "indemnity_letter": "חסר", "payments_to_clients": "84 על אישור זכויות+ נסח טאבו"}'::jsonb, v_user_id);
        
        -- שורה 2: לאטר
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "לאטר", "plan_status": "קיים", "moshav_signature": "קיים", "rami_signature": "חסר", "conditions_form": "קיים", "editor_declaration": "קיים", "submitters_form": "קיים", "form_b1": "שלחתי לחתימה", "section_1_6": "קיים", "section_1_8": "קיים", "section_2": "קיים", "section_3_2": "קיים", "section_4": "קיים", "section_5": "קיים", "section_6": "קיים", "section_7": "קיים", "proposed_state": "קיים", "current_state": "קיים", "building_appendix": "קיים", "indemnity_letter": "חסר", "payments_to_clients": "84 על אישור זכויות + נסח טאבו"}'::jsonb, v_user_id);
        
        -- שורה 3: אוחנה
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "אוחנה", "plan_status": "עשיתי מה שאני יכולה בשביל לקדם. צריך למלא דף הוראות"}'::jsonb, v_user_id);
        
        -- שורה 4: סויסה
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "סויסה", "plan_status": "ממתין_מלקוח", "rights_approval": "בהזמנה- 14.01.26", "moshav_signature": "ממתין_מלקוח", "indemnity_letter": "ללא", "current_state": "קיים", "form_b1": "שלחנו להחתים", "submitters_form": "שלחנו להחתים"}'::jsonb, v_user_id);
        
        -- שורה 5: ויינפלד שלמה
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "ויינפלד שלמה", "plan_status": "לבקש"}'::jsonb, v_user_id);
        
        -- שורה 6: ויינפלד יוסי
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "ויינפלד יוסי", "plan_status": "ממתין_מלקוח"}'::jsonb, v_user_id);
        
        -- שורה 7: בלניצקי
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "בלניצקי"}'::jsonb, v_user_id);
        
        -- שורה 8: בורגן
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "בורגן", "plan_status": "לבקש"}'::jsonb, v_user_id);
        
        -- שורה 9: בוני
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "בוני ", "moshav_signature": "צריך להחתים", "form_b1": "לא רלוונטי", "proposed_state": "קיים", "current_state": "קיים", "building_appendix": "קיים", "plan_status": "לבקש", "editor_declaration": "קיים", "submitters_form": "צריך לשלוח להם מסמך לחתימה", "section_1_8": "קיים", "section_2": "קיים", "section_3_2": "קיים", "section_4": "קיים", "section_5": "קיים", "section_6": "קיים", "section_7": "קיים"}'::jsonb, v_user_id);
        
        -- שורה 10: קולא
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "קולא", "moshav_signature": "קיים", "rights_approval": "חסר", "ownership_docs_rental": "חסר", "ownership_docs_sale": "קיים", "submitters_form": "צריך לקבל חתום עם נצר וללא", "signed_declarations": "כרגע לא רלוונטי", "regulations": "קיים", "current_state": "קיים", "plan_status": "קיים"}'::jsonb, v_user_id);
        
        -- שורה 11: גופין
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "גופין", "rights_approval": "קיים", "submitters_form": "שלחנו להחתים", "plan_status": "צריך להשלים הוראות וזכויות בניה ולגיש מחדש(29.12.25)", "moshav_signature": "קיים", "ownership_docs_rental": "קיים", "ownership_docs_sale": "קיים", "rami_signature": "הלקוח צריך לעדכן אם השלים עסקה מול המנהל ", "conditions_form": "קיים", "editor_declaration": "קיים"}'::jsonb, v_user_id);
        
        -- שורה 12: אשכנזי
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client_name": "אשכנזי", "plan_status": "קיים", "form_b1": "שלחנו להחתים", "indemnity_letter": "ללא"}'::jsonb, v_user_id);
        
        RAISE NOTICE 'טבלה "שינוי תב''''ע" נוצרה עם 12 שורות';
    END IF;

    -- ===========================================
    -- טבלה 2: בקשה להעברת זכויות
    -- ===========================================
    
    INSERT INTO custom_tables (name, display_name, icon, description, columns, created_by, created_at)
    VALUES (
        'transfer_rights_request',
        'בקשה להעברת זכויות',
        'Table',
        'טבלת מעקב בקשות להעברת זכויות',
        '[
            {"id": "col1", "name": "client", "displayName": "לקוח", "type": "text"},
            {"id": "col_1763931947354_1", "name": "status", "displayName": "סטטוס", "type": "text"},
            {"id": "col2", "name": "request_form", "displayName": "טופס בקשה מלא וחתום", "type": "text"},
            {"id": "col_1763030457921", "name": "id_card", "displayName": "תעודת זהות", "type": "text"},
            {"id": "col_1763030480816", "name": "corp_certificate", "displayName": "תעודת האגד", "type": "text"},
            {"id": "col_1763030652584", "name": "lawyer_approval", "displayName": "אישור עו''''ד לתאגיד", "type": "text"},
            {"id": "col_1763030675313", "name": "company_report", "displayName": "תאגיד- דוח רשם החברות", "type": "text"},
            {"id": "col_1763030820054", "name": "foreign_resident", "displayName": "כאשר תושב חוץ", "type": "text"},
            {"id": "col_1763030861482", "name": "both_poa", "displayName": "יפויי כח של שני הצדדים", "type": "text"},
            {"id": "col_1763030898751", "name": "sale_agreement", "displayName": "הסכם מכר", "type": "text"},
            {"id": "col_1763030949074", "name": "relative_transfer", "displayName": "העברה לקרוב- תצהיר העברה לקרוב", "type": "text"},
            {"id": "col_1763030981054", "name": "divorce_ruling", "displayName": "פסק דין אגב גירושין", "type": "text"},
            {"id": "col_1763030996145", "name": "inheritance_order", "displayName": "צו ירושה\\\\ קיום צוואה", "type": "text"},
            {"id": "col_1763031016585", "name": "heirs_agreement", "displayName": "הסכם בין יורשים", "type": "text"},
            {"id": "col_1763031026795", "name": "death_certificate", "displayName": "תעודת פטירה", "type": "text"},
            {"id": "col_1763031065407", "name": "agency_consent", "displayName": "הסכמת הסוכנות היהודית להעברת זכויות לבן ממשיך", "type": "text"},
            {"id": "col_1763031097845", "name": "farm_composition", "displayName": "אישור האגודה על הרכב נחלה", "type": "text"},
            {"id": "col_1763031103254", "name": "survey_map", "displayName": "מפת מדידה", "type": "text"},
            {"id": "col_1763031124113", "name": "planning_info", "displayName": "דף מידע תכנוני מוועדת התכנון", "type": "text"},
            {"id": "col_1763031177359", "name": "liability_clearance", "displayName": "אישור על סילוק התחייבות", "type": "text"},
            {"id": "col_1763031191568", "name": "lien_removal", "displayName": "ביטול עיקול", "type": "text"},
            {"id": "col_1763031204481", "name": "capital_gains_tax", "displayName": "אישור מס שבח", "type": "text"},
            {"id": "col_1763031218780", "name": "purchase_tax", "displayName": "אישור מס רכישה", "type": "text"},
            {"id": "col_1763031253182", "name": "municipal_approvals", "displayName": "אישורים מונציפאליים- כולל אישור ועדה על אי חבות על הטל השבחה וארנונה", "type": "text"},
            {"id": "col_1763031294371", "name": "discount_request", "displayName": "בקשה למתן הנחה", "type": "text"},
            {"id": "col_1763031380935", "name": "supervision_agreement", "displayName": "''''ברית פיקוח בתוקף'''' - חותמי האגודה הם מורשי חתימה מטעמם", "type": "text"},
            {"id": "col_1763031397384", "name": "agency_transfer_consent", "displayName": "הסכמת הסוכנות היהודית להעברת הזכויות", "type": "text"},
            {"id": "col_1763031418529", "name": "lease_deeds", "displayName": "שטרי פעולות שכירות במקרקעי ישראל", "type": "text"},
            {"id": "col_1763031441557", "name": "lease_transfer", "displayName": "כתב העברת זכות חכירה", "type": "text"},
            {"id": "col_1763031506957", "name": "usage_declaration", "displayName": "תצהיר התחייבות להסדרת שימושים- אם יש חריגות בניה- מגרש שהועבר בירושה", "type": "text"}
        ]'::jsonb,
        v_user_id,
        '2025-11-13T10:37:20.501Z'::timestamptz
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_table_id;
    
    IF v_table_id IS NOT NULL THEN
        -- שורה 1: זוננפלד פיצ'ה
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client": "זוננפלד פיצ''''ה", "request_form": "קיים- להשלים מבנים. חתימות אגודה . וחתימות לקוחות", "id_card": "חסר", "corp_certificate": "לא רלוונטי", "lawyer_approval": "לא רלוונטי", "company_report": "לא רלוונטי", "foreign_resident": "לא רלוונטי", "both_poa": "צריך לחתום", "sale_agreement": "קיים", "relative_transfer": "לא רלוונטי", "divorce_ruling": "לא רלוונטי", "inheritance_order": "לא רלוונטי", "farm_composition": "קיים", "survey_map": "חסר. לבקש מוולף מעודכנת", "planning_info": "קיים", "liability_clearance": "קיים", "heirs_agreement": "לא רלוונטי", "death_certificate": "לא רלוונטי", "agency_consent": "לא רלוונטי", "lien_removal": "לא רלוונטי", "capital_gains_tax": "קיים", "purchase_tax": "קיים", "discount_request": "לא רלוונטי", "supervision_agreement": "בקשתי מהוועד", "agency_transfer_consent": "חסר", "lease_deeds": "חסר", "lease_transfer": "לא רלוונטי", "usage_declaration": "לא רלוונטי"}'::jsonb, v_user_id);
        
        -- שורה 2: בוני רון
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client": "בוני רון", "request_form": "קיים", "id_card": "רון- לינור- קיים", "lawyer_approval": "לא רלוונטי", "purchase_tax": "קיים", "capital_gains_tax": "קיים", "supervision_agreement": "קיים", "heirs_agreement": "לא רלוונטי", "usage_declaration": "", "corp_certificate": "לא רלוונטי", "lease_deeds": "חסר- לא דחוף", "company_report": "לא רלוונטי", "both_poa": "בעיקרון יש מודפס", "sale_agreement": "קיים", "divorce_ruling": "לא רלוונטי", "inheritance_order": "לא רלוונטי", "farm_composition": "קיים", "survey_map": "חסר", "lease_transfer": "צריך לחתום", "agency_transfer_consent": "לא רלוונטי", "death_certificate": "לא רלוונטי", "foreign_resident": "לא רלוונטי"}'::jsonb, v_user_id);
        
        RAISE NOTICE 'טבלה "בקשה להעברת זכויות" נוצרה עם 2 שורות';
    END IF;

    -- ===========================================
    -- טבלה 3: מנהל - בקשה לרכישת זכויות
    -- ===========================================
    
    INSERT INTO custom_tables (name, display_name, icon, description, columns, created_by, created_at)
    VALUES (
        'admin_purchase_rights',
        'מנהל - בקשה לרכישת זכויות',
        'Table',
        'טבלת מעקב בקשות לרכישת זכויות במנהל',
        '[
            {"id": "col1762976260495", "name": "client", "displayName": "לקוח", "type": "text"},
            {"id": "col1762976223759", "name": "planning_info", "displayName": "דף מידע תכנוני", "type": "text"},
            {"id": "col2", "name": "tabu_extract", "displayName": "נסח טאבו", "type": "text"},
            {"id": "col1762976267094", "name": "survey_map", "displayName": "מפת מדידה", "type": "text"},
            {"id": "col1762977023681", "name": "committee_approval", "displayName": "אישור הוועדה על תשלום היטל השבחה וארנונה", "type": "text"},
            {"id": "col1762977104786", "name": "signed_request", "displayName": "בקשה לרכישת זכויות חתומה", "type": "text"},
            {"id": "col1762977106373", "name": "lien_clearance", "displayName": "סילוק שיעבוד", "type": "text"},
            {"id": "col1762977109229", "name": "farm_composition", "displayName": "אישור האגודה  על הרכב הנחלה", "type": "text"},
            {"id": "col1762993328550", "name": "successor_notice", "displayName": "הודעה על קביעת בן ממשיך", "type": "text"},
            {"id": "col1762993358443", "name": "property_declaration", "displayName": "תצהיר מבקש בדבר מצב המקרקעין", "type": "text"},
            {"id": "col1762993377268", "name": "split_approval", "displayName": "אישור פיצול חתום ע''''י מורשה חתימה", "type": "text"},
            {"id": "col1762993393798", "name": "tatzar_commitment", "displayName": "התחייבות לתיקון התצ''''ר", "type": "text"},
            {"id": "col1762993414231", "name": "mortgage_clearance", "displayName": "אישור סילוק משכנתא", "type": "text"},
            {"id": "col1762993435130", "name": "agency_approval", "displayName": "אישור הסוכנות היהודית", "type": "text"},
            {"id": "col1762993479873", "name": "transfer_request", "displayName": "בקשה להעברת זכויות(כאשר עסקת הפיצול עבור צד ג)", "type": "text"},
            {"id": "col1762993494673", "name": "sale_agreement", "displayName": "הסכם מכר בין הצדדים", "type": "text"},
            {"id": "col1762993512851", "name": "purchase_tax", "displayName": "אישור מס רכישה", "type": "text"},
            {"id": "col1762993525130", "name": "capital_gains_tax", "displayName": "אישור מס שבח", "type": "text"},
            {"id": "col1762993547095", "name": "municipal_taxes", "displayName": "אישור מיסים מונציפליים- על אי חבות ארנונה", "type": "text"},
            {"id": "col1762993562833", "name": "betterment_levy", "displayName": "קבלה על תשלום היטל השבחה", "type": "text"},
            {"id": "col1762993592855", "name": "lease_deeds", "displayName": "שלושה שטרי שכירות ומשכנתא- מקור", "type": "text"},
            {"id": "col1762993614482", "name": "fee_voucher", "displayName": "שובר אגרה לביצוע העסקה", "type": "text"}
        ]'::jsonb,
        v_user_id,
        '2025-11-12T19:26:44.518Z'::timestamptz
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_table_id;
    
    IF v_table_id IS NOT NULL THEN
        -- שורה 1: פיצ'ה זוננפלד
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client": "פיצ''''ה זוננפלד", "planning_info": "קיים", "survey_map": "חסר עדכני- וולף", "farm_composition": "קיים", "tabu_extract": "קיים", "committee_approval": "קיים", "signed_request": "קיים- צריך לחתום", "lien_clearance": "קיים נסח טאבו", "successor_notice": "לא רלוונטי", "property_declaration": "צריך לחתום", "split_approval": "לא רלוונטי", "tatzar_commitment": "צריך לחתום", "mortgage_clearance": "קיים- נסח טאבו", "agency_approval": "צריך להגיש בקשה", "transfer_request": "לא רלוונטי", "sale_agreement": "קיים", "purchase_tax": "קיים", "capital_gains_tax": "קיים", "municipal_taxes": "חסר", "betterment_levy": "קיים", "lease_deeds": "חסר- צריך לחתום", "fee_voucher": "לא רלוונטי"}'::jsonb, v_user_id);
        
        -- שורה 2: בוני רון
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client": "בוני רון", "tabu_extract": "קיים", "farm_composition": "קיים", "planning_info": "בהזמנה- שולם", "survey_map": "קיים", "lien_clearance": "לא רלוונטי", "successor_notice": "לא רלוונטי", "split_approval": "לא רלוונטי", "mortgage_clearance": "צריך נסח טאבו", "tatzar_commitment": "לא רלוונטי", "agency_approval": "לא רלוונטי", "capital_gains_tax": "קיים", "lease_deeds": "חסר- לא דחוף", "committee_approval": "קיים - ארנונה צריך לחדש תאריך", "signed_request": "קיים", "transfer_request": "לא רלוונטי", "sale_agreement": "קיים", "purchase_tax": "קיים", "municipal_taxes": "חסר", "betterment_levy": "חסר", "fee_voucher": "לא רלוונטי"}'::jsonb, v_user_id);
        
        -- שורה 3: בדני רונן
        INSERT INTO custom_table_data (table_id, data, created_by)
        VALUES (v_table_id, '{"client": "בדני רונן", "planning_info": "בהזמנה", "tabu_extract": "חסר", "survey_map": "חסר עדכני- ח.ח מדידה", "committee_approval": "קיים", "lease_deeds": "חסר- לא דחוף", "signed_request": "קיים- צריך לחתום", "lien_clearance": "חסר", "split_approval": "לא רלוונטי", "farm_composition": "שלחנו מייל לאגודה", "successor_notice": "לא רלוונטי", "mortgage_clearance": "צריך נסח טאבו", "agency_approval": "צריך להגיש בקשה", "transfer_request": "לא רלוונטי", "sale_agreement": "מה עושים אם קבלו במתנה", "purchase_tax": "חסר", "capital_gains_tax": "קיים", "municipal_taxes": "חסר", "betterment_levy": "קיים", "fee_voucher": "לא רלוונטי", "tatzar_commitment": "לא רלוונטי"}'::jsonb, v_user_id);
        
        RAISE NOTICE 'טבלה "מנהל - בקשה לרכישת זכויות" נוצרה עם 3 שורות';
    END IF;

END $$;

-- סיכום
SELECT 'טבלאות custom:', COUNT(*) FROM custom_tables;
SELECT 'שורות נתונים:', COUNT(*) FROM custom_table_data;
