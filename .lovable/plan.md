## מטרה
להרחיב את מערכת ה-HR/Payroll הקיימת לתלוש שכר ישראלי מלא ומדויק, **בלי כפילויות** - להישען על כל מה שכבר קיים (מס, ביטל"א, פנסיה, השתלמות, נוכחות, חופשות, גרסאות חוק) ולהשלים רק את החסר.

## עקרון מנחה
לא מוחקים שום קוד קיים. רק:
- מוסיפים עמודות חסרות ל-`employees`
- מרחיבים `calcPayroll` עם רכיבים חדשים (הבראה, נסיעות לפי ק"מ, שווי רכב/טלפון/ביגוד)
- מחליפים את `EmployeeEditDialog` הקיים ב-Wizard מודרני עם 6 טאבים
- מוסיפים מודול PDF לתלוש שכר
- מוסיפים עוזר AI שמזהה חסרים ומציע ערכים

---

## שלב 1 - הרחבת DB (migration אחד)

הוספת עמודות חסרות ל-`employees`:

**אישי:**
- `gender` TEXT CHECK('male','female','other')
- `marital_status` TEXT CHECK('single','married','divorced','widowed','separated')
- `children_count` INTEGER DEFAULT 0
- `children_data` JSONB (מערך {name, birth_date, has_custody})
- `spouse_works` BOOLEAN
- `spouse_id_number` TEXT

**כתובת ומוצא:**
- `address_street`, `address_city`, `address_zip` TEXT
- `address_lat`, `address_lng` NUMERIC
- `country_of_origin` TEXT
- `aliyah_date` DATE (עולה חדש - 1/3/4.5 נק' זיכוי לפי שנה)
- `disability_pct` NUMERIC(5,2)

**השכלה ומקצוע:**
- `academic_degree` TEXT, `degree_completion_year` INTEGER
- `profession_code` TEXT

**העסקה:**
- `position_ratio_pct` NUMERIC(5,2) DEFAULT 100  (יחס משרה)
- `work_distance_km` NUMERIC(6,2)  (לחישוב נסיעות אוטומטי)
- `has_company_car` BOOLEAN, `company_car_value` NUMERIC
- `has_company_phone` BOOLEAN, `company_phone_value` NUMERIC
- `clothing_allowance_annual` NUMERIC
- `recuperation_days_used` NUMERIC(5,2) DEFAULT 0

**בנק (פירוק):**
- `bank_code` TEXT, `bank_branch` TEXT, `bank_account_number` TEXT

**פנסיה/השתלמות מורחב:**
- `pension_fund_name` TEXT, `pension_policy_number` TEXT
- `study_fund_name` TEXT, `study_fund_policy_number` TEXT

טבלה חדשה `payroll_recuperation_rates`:
- שנה, ערך יום הבראה לפי מגזר (ברירת מחדל 471₪ ל-2026)

---

## שלב 2 - הרחבת `src/lib/payroll.ts`

**פונקציות חדשות (לא מחליפות קיימות):**

1. `calcTaxCreditPoints(employee, year)` - חישוב אוטומטי לפי חוק:
   - תושב = 2.25
   - אישה = +0.5
   - ילד 0-5 = +2.5 לכל ילד (לאם) / +1 (לאב עם משמורת)
   - ילד 6-17 = +1
   - הורה יחיד = +1
   - עולה חדש = 3/2/1 לפי שנה מעלייה
   - סיום תואר ראשון = +1 (3 שנים) / שני = +0