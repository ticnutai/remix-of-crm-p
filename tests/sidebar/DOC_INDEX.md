# 📚 מפת התיעוד - מערכת בדיקות Sidebar

## ברוכים הבאים! 👋

זהו המדריך המרכזי לכל התיעוד של מערכת הבדיקות.

---

## 🚀 להתחלה מהירה

**רוצה להתחיל מהר?**
1. קרא: [INSTALLATION.md](./INSTALLATION.md) - התקנה (5 דקות)
2. קרא: [QUICK_START.md](./QUICK_START.md) - שימוש ראשון (2 דקות)
3. הרץ: `npm run test:sidebar`

---

## 📖 תיעוד מלא

### למתחילים 🌱

| מסמך | תיאור | זמן קריאה |
|------|-------|-----------|
| [INSTALLATION.md](./INSTALLATION.md) | הוראות התקנה מפורטות | 5 דק' |
| [QUICK_START.md](./QUICK_START.md) | התחלה מהירה | 2 דק' |
| [examples.ts](./examples.ts) | דוגמאות קוד | 10 דק' |

### למפתחים 👨‍💻

| מסמך | תיאור | זמן קריאה |
|------|-------|-----------|
| [README.md](./README.md) | מדריך מקיף | 15 דק' |
| [STRUCTURE.md](./STRUCTURE.md) | מבנה הפרויקט | 8 דק' |
| [index.ts](./index.ts) | API מרכזי | קוד |

### למנהלים 📊

| מסמך | תיאור | זמן קריאה |
|------|-------|-----------|
| [SUMMARY.md](./SUMMARY.md) | סיכום המערכת | 5 דק' |
| [test-config.json](./test-config.json) | תצורה | JSON |
| מסמך זה | מפת תיעוד | 3 דק' |

---

## 🎯 לפי מטרה

### "רוצה להריץ בדיקות"
1. [INSTALLATION.md](./INSTALLATION.md) - התקן
2. [QUICK_START.md](./QUICK_START.md) - הרץ
3. ✅ סיימת!

### "רוצה להבין איך זה עובד"
1. [README.md](./README.md) - קרא הכל
2. [STRUCTURE.md](./STRUCTURE.md) - הבן מבנה
3. [examples.ts](./examples.ts) - ראה דוגמאות

### "רוצה להוסיף בדיקות"
1. [README.md](./README.md) - הבן מערכת
2. [index.ts](./index.ts) - השתמש ב-API
3. [examples.ts](./examples.ts) - ראה איך

### "רוצה לפתור בעיה"
1. [INSTALLATION.md](./INSTALLATION.md) → פתרון בעיות
2. [README.md](./README.md) → שאלות נפוצות
3. הרץ: `npm run test:sidebar -- --debug`

---

## 📁 מבנה קבצים

```
tests/sidebar/
│
├── 📚 תיעוד למשתמש
│   ├── INSTALLATION.md      ⭐ התקנה
│   ├── QUICK_START.md       ⭐ התחלה מהירה
│   └── DOC_INDEX.md         📍 אתה כאן
│
├── 📚 תיעוד טכני
│   ├── README.md            📖 מדריך מלא
│   ├── SUMMARY.md           📊 סיכום
│   └── STRUCTURE.md         📐 מבנה
│
├── 🧪 קבצי בדיקות
│   ├── mainNavItems.test.ts
│   ├── systemNavItems.test.ts
│   ├── customTables.test.ts
│   ├── appSidebar.test.ts
│   └── index.test.ts
│
└── ⚙️ כלים
    ├── index.ts                  🔧 API
    ├── examples.ts               💡 דוגמאות
    ├── test-config.json          ⚙️ תצורה
    └── run-sidebar-tests.ps1     🛠️ סקריפט
```

---

## 🎓 מסלולי למידה

### מסלול מהיר (10 דקות)
1. ✅ [INSTALLATION.md](./INSTALLATION.md) - התקן
2. ✅ [QUICK_START.md](./QUICK_START.md) - הרץ
3. ✅ `npm run test:sidebar` - בדוק

### מסלול בסיסי (30 דקות)
1. ✅ [INSTALLATION.md](./INSTALLATION.md)
2. ✅ [QUICK_START.md](./QUICK_START.md)
3. ✅ [README.md](./README.md) - קרא חלק "מה נבדק"
4. ✅ [examples.ts](./examples.ts) - דוגמאות 1-5

### מסלול מתקדם (1 שעה)
1. ✅ כל מסלול הבסיסי
2. ✅ [README.md](./README.md) - קרא הכל
3. ✅ [STRUCTURE.md](./STRUCTURE.md) - הבן מבנה
4. ✅ [index.ts](./index.ts) - למד API
5. ✅ [examples.ts](./examples.ts) - כל הדוגמאות

### מסלול מומחה (2 שעות)
1. ✅ כל מסלול המתקדם
2. ✅ קרא את כל קבצי הבדיקות
3. ✅ נסה להוסיף בדיקה חדשה
4. ✅ צור integration עם CI/CD

---

## 🔍 חיפוש מהיר

### איך ל...?

| שאלה | מסמך | סעיף |
|------|------|------|
| להתקין? | [INSTALLATION.md](./INSTALLATION.md) | התקנה |
| להריץ? | [QUICK_START.md](./QUICK_START.md) | הרצה מהירה |
| להבין מבנה? | [STRUCTURE.md](./STRUCTURE.md) | כל המסמך |
| לראות דוגמאות? | [examples.ts](./examples.ts) | דוגמאות 1-13 |
| לפתור בעיה? | [INSTALLATION.md](./INSTALLATION.md) | פתרון בעיות |
| להוסיף בדיקה? | [README.md](./README.md) | עדכון הבדיקות |
| להשתמש ב-API? | [index.ts](./index.ts) | Functions |
| לראות תצורה? | [test-config.json](./test-config.json) | JSON |

---

## 📊 סטטיסטיקות

### קבצי תיעוד
- **6 מסמכי markdown** - תיעוד מלא
- **1 קובץ דוגמאות** - 13 דוגמאות קוד
- **1 קובץ API** - פונקציות עזר
- **1 קובץ תצורה** - נתוני בסיס

### כיסוי נושאים
- ✅ התקנה והגדרה
- ✅ הרצה ושימוש
- ✅ מבנה ותכנון
- ✅ API ודוגמאות
- ✅ פתרון בעיות
- ✅ CI/CD
- ✅ אופטימיזציה

---

## 🎯 לפי תפקיד

### אני מפתח Frontend
**קרא**:
1. [QUICK_START.md](./QUICK_START.md)
2. [examples.ts](./examples.ts) - דוגמאות 1-6
3. [index.ts](./index.ts) - API functions

### אני QA/Tester
**קרא**:
1. [INSTALLATION.md](./INSTALLATION.md)
2. [README.md](./README.md)
3. כל קבצי הבדיקות (*.test.ts)

### אני מנהל פרויקט
**קרא**:
1. [SUMMARY.md](./SUMMARY.md)
2. [README.md](./README.md) - סיכומים
3. [STRUCTURE.md](./STRUCTURE.md)

### אני DevOps
**קרא**:
1. [INSTALLATION.md](./INSTALLATION.md) - CI/CD
2. [test-config.json](./test-config.json)
3. [run-sidebar-tests.ps1](./run-sidebar-tests.ps1)

---

## ⚡ פעולות מהירות

```bash
# הרץ הכל
npm run test:sidebar

# הרץ בדיקה ספציפית
npm run test:sidebar:main

# עם coverage
npm run test:sidebar:coverage

# watch mode
npm run test:sidebar:watch

# debug mode
npm run test:sidebar -- --debug
```

---

## 🆘 עזרה

### תקוע? נסה זה:
1. ✅ [INSTALLATION.md](./INSTALLATION.md) → פתרון בעיות
2. ✅ [README.md](./README.md) → שאלות נפוצות
3. ✅ `npm run test:sidebar -- --debug`
4. ✅ צור קשר עם המפתח

### רוצה לתרום?
1. קרא [README.md](./README.md) → תרומה
2. ראה [examples.ts](./examples.ts)
3. הוסף בדיקות
4. עדכן תיעוד

---

## 📞 איש קשר

לשאלות, בעיות או הצעות:
- 📖 תיעוד מלא: [README.md](./README.md)
- 🐛 בעיות: צור issue
- 💡 הצעות: פנה למפתח

---

## ✅ Checklist

לפני שמתחילים:
- [ ] קראתי [INSTALLATION.md](./INSTALLATION.md)
- [ ] קראתי [QUICK_START.md](./QUICK_START.md)
- [ ] הרצתי `npm run test:sidebar`
- [ ] כל הבדיקות עוברות ✅

מוכן להמשיך:
- [ ] קראתי [README.md](./README.md)
- [ ] הבנתי את [STRUCTURE.md](./STRUCTURE.md)
- [ ] ראיתי [examples.ts](./examples.ts)
- [ ] אני יודע להשתמש ב-API

---

## 🎉 סיכום

יש לך כעת:
- ✅ 6 מסמכי תיעוד מפורטים
- ✅ 5 קבצי בדיקות (225+ tests)
- ✅ API מלא לשימוש
- ✅ 13 דוגמאות קוד
- ✅ סקריפטים להרצה
- ✅ תצורה מלאה

**מוכן להתחיל? קרא [QUICK_START.md](./QUICK_START.md)! 🚀**
