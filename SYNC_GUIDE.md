# 🔄 מדריך סינכרון דו-צדדי - CRM Pro

## סקירה כללית

מערכת הסינכרון הדו-צדדי מאפשרת לך לעבוד עם הפרויקט בצורה חלקה:
- **סינכרון קוד**: Git (pull/push אוטומטי עם GitHub)
- **סינכרון מידע**: Supabase (migrations ונתונים)

## 📋 דרישות מקדימות

✅ Node.js v25+ (מותקן)
✅ Git (מותקן)
✅ Supabase CLI (מותקן)

## 🚀 התחלה מהירה

### שלב 1: התחברות ל-Supabase (חד פעמי)

```powershell
# התחברות ל-Supabase (פותח דפדפן לאישור)
supabase login

# קישור לפרויקט
supabase link --project-ref eadeymehidcndudeycnf
```

**💡 טיפ**: תצטרך את ה-database password שלך מפאנל Supabase

### שלב 2: הגדרת Access Token (חד פעמי)

1. היכנס ל-Supabase Dashboard: https://app.supabase.com
2. לחץ על הפרויקט שלך
3. Settings → API
4. העתק את ה-`anon/public key`
5. עדכן את קובץ `.env`:

```env
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_ACTUAL_KEY_HERE"
```

### שלב 3: הפעלת סינכרון

#### סינכרון מלא (מומלץ)
```powershell
.\sync-all.ps1
```

#### סינכרון Git בלבד
```powershell
.\sync-git.ps1
```

#### סינכרון Supabase בלבד
```powershell
.\sync-supabase.ps1
```

## 📁 קבצי הסקריפטים

| קובץ | תיאור |
|------|-------|
| `sync-all.ps1` | סינכרון מלא - Git + Supabase |
| `sync-git.ps1` | סינכרון Git בלבד (pull/push) |
| `sync-supabase.ps1` | סינכרון Supabase בלבד (migrations) |
| `start-dev.ps1` | הפעלת שרת פיתוח |

## 🔄 תהליך הסינכרון

### Git Sync מבצע:
1. ✅ בדיקת שינויים מקומיים
2. 📝 commit אוטומטי (אם יש שינויים)
3. ⬇️ pull מ-GitHub
4. ⬆️ push ל-GitHub

### Supabase Sync מבצע:
1. 🔗 בדיקת חיבור לפרויקט
2. ⬇️ משיכת migrations מ-Cloud
3. ⬆️ דחיפת migrations חדשים

## 🛠️ פתרון בעיות

### "Git command not found"
```powershell
$env:Path += ";C:\Program Files\Git\cmd"
```

### "Supabase command not found"
```powershell
$env:Path += ";$env:USERPROFILE\scoop\shims"
```

### "Authentication required"
```powershell
# התחבר מחדש
supabase login
```

### קונפליקטים ב-Git
אם יש קונפליקטים, הסקריפט יעצור ויודיע לך. פתור אותם ידנית:
```powershell
git status
# פתור את הקונפליקטים
git add .
git commit -m "Resolved conflicts"
git push
```

## 📊 גיבוי ושחזור

### יצירת גיבוי מלא
```powershell
# גיבוי Git
git commit -am "Backup $(Get-Date -Format 'yyyy-MM-dd')"
git push

# גיבוי Supabase schemas
supabase db dump -f backup-$(Get-Date -Format 'yyyy-MM-dd').sql
```

### שחזור מגיבוי
```powershell
# שחזור מ-Git
git checkout <commit-hash>

# שחזור Supabase
supabase db reset
psql -h <host> -U postgres -d postgres -f backup.sql
```

## ⚙️ סינכרון אוטומטי (אופציונלי)

### Windows Task Scheduler

1. פתח Task Scheduler
2. צור Task חדש
3. Trigger: כל שעה / יומי
4. Action: הפעל PowerShell
5. הוסף ארגומנט: `-File "C:\path\to\sync-all.ps1"`

### VS Code Task

קובץ `.vscode/tasks.json` כבר מכיל task לסינכרון:
```json
{
  "label": "Full Sync",
  "type": "shell",
  "command": "powershell -File sync-all.ps1"
}
```

הפעל דרך: `Ctrl+Shift+P` → `Tasks: Run Task` → `Full Sync`

## 📞 עזרה נוספת

- [תיעוד Supabase CLI](https://supabase.com/docs/guides/cli)
- [Git Documentation](https://git-scm.com/doc)
- [קבצי README של הפרויקט](./README.md)

---

**🎉 בהצלחה עם הסינכרון!**
