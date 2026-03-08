# 🚀 מדריך התחלה מהיר - בדיקות Sidebar

## התקנה ראשונית

אם עדיין לא התקנת את Playwright:

```bash
npm install -D @playwright/test
npx playwright install
```

## הרצה מהירה

### דרך 1: npm scripts (מומלץ)
```bash
# כל בדיקות הסיידבר
npm run test:sidebar

# בדיקות ספציפיות
npm run test:sidebar:main         # ניווט ראשי (20 טאבים)
npm run test:sidebar:system       # ניווט מערכת (8 טאבים)
npm run test:sidebar:custom       # טבלאות מותאמות
npm run test:sidebar:app          # פונקציונליות כללית
npm run test:sidebar:integration  # בדיקות אינטגרציה

# עם אופציות
npm run test:sidebar:coverage     # עם coverage report
npm run test:sidebar:watch        # במצב watch (הרצה אוטומטית)
```

### דרך 2: PowerShell Script
```powershell
# כל הבדיקות
.\tests\sidebar\run-sidebar-tests.ps1

# בדיקות ספציפיות
.\tests\sidebar\run-sidebar-tests.ps1 -File main
.\tests\sidebar\run-sidebar-tests.ps1 -File system
.\tests\sidebar\run-sidebar-tests.ps1 -File custom
.\tests\sidebar\run-sidebar-tests.ps1 -File app

# עם אופציות
.\tests\sidebar\run-sidebar-tests.ps1 -Coverage
.\tests\sidebar\run-sidebar-tests.ps1 -Watch
.\tests\sidebar\run-sidebar-tests.ps1 -Debug
```

### דרך 3: Playwright ישירות
```bash
# כל הבדיקות
npx playwright test tests/sidebar

# בדיקה ספציפית
npx playwright test tests/sidebar/mainNavItems.test.ts
```

## מה מבודק?

### ✅ 28 טאבים קבועים
- 20 טאבי ניווט ראשי
- 8 טאבי ניווט מערכת

### ✅ פונקציונליות
- Pin/Unpin
- Hover Detection
- Resize (240-480px)
- Auto-hide
- localStorage

### ✅ תקינות נתונים
- אין כפילויות (URL, שם, testId)
- פורמט URLs נכון
- Icons תקינים
- מבנה עקבי

### ✅ אינטגרציה
- אין חפיפות בין קבוצות
- customTables לא מתנגשים
- מערכת שלמה עקבית

## פלט מצופה

```
🧪 מערכת בדיקות Sidebar
================================

🚀 מריץ: npx playwright test tests/sidebar

Running 225 tests...

  ✓ mainNavItems.test.ts (50 tests)
  ✓ systemNavItems.test.ts (40 tests)
  ✓ customTables.test.ts (45 tests)
  ✓ appSidebar.test.ts (55 tests)
  ✓ index.test.ts (35 tests)

✅ כל הבדיקות עברו בהצלחה!

225 passed (5.2s)
```

## בדיקה מהירה

רק לבדוק שהכל תקין:
```bash
npm run test:sidebar
```

אמור להיות ירוק ✅ ללא שגיאות.

## תיעוד מלא

📖 [README.md](./README.md) - תיעוד מפורט  
📊 [SUMMARY.md](./SUMMARY.md) - סיכום המערכת  
⚙️ [test-config.json](./test-config.json) - קובץ תצורה

## בעיות נפוצות

### Playwright לא מותקן
```bash
npm install -D @playwright/test
npx playwright install
```

### הבדיקות נכשלות
1. וודא ש-AppSidebar.tsx לא השתנה
2. בדוק את test-config.json
3. הרץ במצב debug: `npm run test:sidebar -- --debug`

### רוצה לראות פרטים
```bash
npm run test:sidebar -- --reporter=verbose
```

## עזרה

- 🐛 בעיות? הרץ עם `--debug`
- 📖 שאלות? קרא את README.md
- 💬 צריך עזרה? פנה למפתח

---

**זמן קריאה: 2 דקות | זמן הרצה: 5 שניות** ⚡
