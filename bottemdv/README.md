# 📁 Scripts - סקריפטים למפתחים

## 🚀 התחלה מהירה

### Windows (PowerShell)
```powershell
# להפעלה מלאה (ניקוי + התקנה + שרת)
.\scripts\setup-dev-tools.ps1 -All

# או שלב אחר שלב:
.\scripts\setup-dev-tools.ps1 -Install   # רק התקנה
.\scripts\setup-dev-tools.ps1 -Start     # רק הפעלת שרת
.\scripts\setup-dev-tools.ps1 -Clean     # רק ניקוי
```

### Linux/Mac (Bash)
```bash
# הפוך לניתן להרצה
chmod +x scripts/setup-dev-tools.sh

# להפעלה מלאה
./scripts/setup-dev-tools.sh --all

# או שלב אחר שלב:
./scripts/setup-dev-tools.sh --install
./scripts/setup-dev-tools.sh --start
./scripts/setup-dev-tools.sh --clean
```

## 📋 מה הסקריפט עושה?

| שלב | תיאור |
|-----|-------|
| 🔍 **בדיקת דרישות** | Node.js, Bun, Git, VS Code |
| 🧹 **ניקוי** | node_modules, dist, Vite cache, Bun cache |
| 📦 **התקנה** | bun install |
| ⚙️ **הגדרות VS Code** | settings.json, extensions.json |
| 🚀 **הפעלה** | bun dev |

## 🔧 כלי פיתוח מובנים

אחרי שהשרת רץ, לך ל**הגדרות** והפעל **מצב פיתוח**:

- 📟 **קונסול** - כל console.log/error במקום אחד
- 🔍 **זיהוי אלמנטים** - לחץ על כל אלמנט לזהות את הקומפוננטה
- 🤖 **Copilot** - שלח מידע ישירות ל-VS Code Copilot
- 🧹 **ניקוי קאש** - נקה הכל ברענן אחד

## 📖 תיעוד מפורט

ראה [DEVELOPER_TOOLS_GUIDE.md](../DEVELOPER_TOOLS_GUIDE.md) למדריך מלא.
