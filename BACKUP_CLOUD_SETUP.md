# הגדרת גיבויים בענן - הוראות

## מצב נוכחי
המערכת כעת מוכנה לשמור גיבויים גם במחשב וגם בענן, אבל צריך להריץ את ה-migration.

## שלב 1: יצירת טבלת backups ב-Supabase

1. היכנס ל-Supabase Dashboard: https://app.supabase.com
2. בחר את הפרויקט שלך
3. לך ל-**SQL Editor** בתפריט הצד
4. לחץ על **New Query**
5. העתק והדבק את הקוד הבא:

```sql
-- Create backups table for cloud backup storage
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  size BIGINT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  data JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_backups_user_id ON backups(user_id);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backups_backup_id ON backups(backup_id);

-- Enable RLS
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own backups
CREATE POLICY "Users can view their own backups"
  ON backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backups"
  ON backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own backups"
  ON backups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON backups FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER backups_updated_at
  BEFORE UPDATE ON backups
  FOR EACH ROW
  EXECUTE FUNCTION update_backups_updated_at();

-- Add comment
COMMENT ON TABLE backups IS 'Stores backup data in the cloud with user isolation';
```

6. לחץ על **Run** (או Ctrl+Enter)
7. אם הכל תקין, תראה הודעה: "Success. No rows returned"

## שלב 2: אישור שהטבלה נוצרה

1. לך ל-**Table Editor** בתפריט הצד
2. חפש את הטבלה `backups`
3. ודא שהיא קיימת עם כל העמודות הנדרשות

## שלב 3: בדיקת הפונקציונליות

1. רענן את האתר (F5)
2. לך לדף **גיבויים**
3. צור גיבוי חדש
4. אמורה להופיע הודעה: **"הגיבוי נוצר בהצלחה - הגיבוי נשמר במחשב ובענן ☁️"**
5. בדוק ב-Supabase Table Editor שהגיבוי נשמר בענן

## מה השתנה?

### 📁 קבצים שהשתנו:
1. **supabase/migrations/20260201000000_create_backups_table.sql** - Migration חדש
2. **src/hooks/useBackupRestore.tsx** - עודכן לתמיכה בענן
3. **src/components/HealthCheck.tsx** - הוספה בדיקת טבלת backups

### 🎯 פיצ'רים חדשים:
- ✅ שמירת גיבויים אוטומטית בענן (אם המשתמש מחובר)
- ✅ גיבוי כפול: localStorage + Supabase
- ✅ סנכרון אוטומטי בין המחשב לענן
- ✅ מחיקה משני המקומות
- ✅ RLS - כל משתמש רואה רק את הגיבויים שלו
- ✅ גיבוי לוקאלי ממשיך לעבוד גם אם אין חיבור לענן

### 🔒 אבטחה:
- משתמשים יכולים לראות רק את הגיבויים שלהם (RLS)
- כל פעולה מאומתת מול auth.uid()
- ON DELETE CASCADE - מחיקת משתמש תמחק את כל הגיבויים שלו

## בעיות אפשריות ופתרונות

### שגיאה: "relation backups does not exist"
**פתרון:** הרץ את ה-SQL מהשלב 1

### שגיאה: "permission denied for table backups"
**פתרון:** ודא שה-RLS policies הוגדרו נכון

### הגיבוי נשמר רק מקומית
**פתרון:** ודא שאתה מחובר (יש user) ושהטבלה קיימת

## תמיכה טכנית
אם יש בעיה, בדוק את הקונסול של הדפדפן (F12) לשגיאות.
