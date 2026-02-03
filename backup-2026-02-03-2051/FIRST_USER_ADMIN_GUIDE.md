# בדיקת מערכת המשתמש הראשון הופך למנהל

## מה קורה כשנרשם משתמש ראשון?

כאשר משתמש נרשם לראשונה למערכת דרך דף ההרשמה:

1. Supabase יוצר משתמש ב-`auth.users`
2. ה-trigger `on_auth_user_created` מופעל אוטומטית
3. הפונקציה `handle_new_user()` רצה ובודקת כמה משתמשים יש ב-`profiles`
4. אם אין משתמשים (`user_count = 0`), המשתמש מקבל תפקיד `admin`
5. אם יש כבר משתמשים, המשתמש מקבל תפקיד `employee`

## בדיקה ידנית

### שלב 1: בדוק את המצב הנוכחי

הרץ את הקובץ `test_first_user_admin.sql` בקונסול של Supabase (SQL Editor) כדי לראות:
- האם הפונקציה וה-trigger קיימים
- מי המשתמש הראשון והאם הוא מנהל

### שלב 2: בדיקה מלאה (אופציונלי - רק אם אין משתמשים!)

אם אין משתמשים כלל במערכת, אפשר לבדוק:

1. **הרשמה ראשונה:**
   - לך לדף הרישום: http://localhost:8081/auth
   - לחץ על "הרשמה"
   - מלא את הפרטים והירשם
   - בדוק שהמשתמש קיבל תפקיד `admin`

2. **הרשמה שנייה:**
   - צא מהמערכת
   - הירשם עם אימייל אחר
   - בדוק שהמשתמש השני קיבל תפקיד `employee`

### שלב 3: SQL לבדיקה מהירה

```sql
-- בדוק את המשתמש הראשון
SELECT 
    p.email,
    p.created_at,
    ur.role,
    ROW_NUMBER() OVER (ORDER BY p.created_at) as user_number
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
ORDER BY p.created_at ASC
LIMIT 1;
```

**תוצאה צפויה:** המשתמש הראשון (`user_number = 1`) צריך להיות בעל תפקיד `admin`.

## קוד רלוונטי

### Migration: `20260119230407_939b7db1-c2d5-4c46-b8dc-bc73b45fbb3a.sql`

הפונקציה שמטפלת ביצירת משתמש חדש:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
  assigned_role app_role;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  -- First user gets admin role
  IF user_count = 0 THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'employee';
  END IF;

  -- Create profile and assign role
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)), true);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role);
  
  RETURN NEW;
END;
$$;
```

### Trigger על auth.users

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## סיכום

✅ המערכת מוגדרת נכון
✅ ה-trigger והפונקציה קיימים
✅ המשתמש הראשון אוטומטית יקבל תפקיד מנהל
✅ משתמשים נוספים יקבלו תפקיד עובד כברירת מחדל
