# 📦 הוראות התקנה - מערכת בדיקות Sidebar

## ✅ דרישות מקדימות

- Node.js (גרסה 16 ומעלה)
- npm או yarn
- הפרויקט הראשי מותקן ופועל

## 🚀 התקנה

### שלב 1: התקן Playwright
```bash
npm install -D @playwright/test
```

### שלב 2: התקן Browsers
```bash
npx playwright install
```

### שלב 3: בדוק שהכל עובד
```bash
npm run test:sidebar
```

אם הכל תקין, תראה:
```
✅ כל הבדיקות עברו בהצלחה!
225 passed (5.2s)
```

## 📝 פקודות זמינות

כל הפקודות כבר מוגדרות ב-package.json:

```json
{
  "scripts": {
    "test:sidebar": "playwright test tests/sidebar",
    "test:sidebar:main": "playwright test tests/sidebar/mainNavItems.test.ts",
    "test:sidebar:system": "playwright test tests/sidebar/systemNavItems.test.ts",
    "test:sidebar:custom": "playwright test tests/sidebar/customTables.test.ts",
    "test:sidebar:app": "playwright test tests/sidebar/appSidebar.test.ts",
    "test:sidebar:integration": "playwright test tests/sidebar/index.test.ts",
    "test:sidebar:coverage": "playwright test tests/sidebar --coverage",
    "test:sidebar:watch": "playwright test tests/sidebar --watch"
  }
}
```

## 🎯 דוגמאות שימוש

### הרצה בסיסית
```bash
npm run test:sidebar
```

### בדיקה ספציפית
```bash
npm run test:sidebar:main
```

### עם coverage
```bash
npm run test:sidebar:coverage
```

### במצב watch (עדכון אוטומטי)
```bash
npm run test:sidebar:watch
```

## 🐛 פתרון בעיות

### בעיה: "playwright: command not found"
**פתרון**:
```bash
npm install -D @playwright/test
npx playwright install
```

### בעיה: "Cannot find module"
**פתרון**:
```bash
npm install
```

### בעיה: הבדיקות נכשלות
**פתרון**:
1. בדוק ש-AppSidebar.tsx לא השתנה
2. בדוק את test-config.json
3. הרץ במצב debug:
```bash
npm run test:sidebar -- --debug
```

### בעיה: הבדיקות איטיות
**פתרון**:
```bash
npm run test:sidebar -- --workers=4
```

## 📊 תצורה מתקדמת

### הגדרת Timeout
ערוך את `playwright.config.ts`:
```typescript
export default {
  timeout: 30000, // 30 שניות
  testDir: './tests',
}
```

### הרצה במקביל
```bash
npm run test:sidebar -- --workers=4
```

### דוחות מותאמים
```bash
npm run test:sidebar -- --reporter=html
npm run test:sidebar -- --reporter=json
npm run test:sidebar -- --reporter=junit
```

## 🔐 CI/CD Integration

### GitHub Actions
צור `.github/workflows/sidebar-tests.yml`:
```yaml
name: Sidebar Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npm run test:sidebar
```

### GitLab CI
צור `.gitlab-ci.yml`:
```yaml
test:
  script:
    - npm install
    - npm run test:sidebar
```

## 📈 Monitoring

### הצגת דוח HTML
```bash
npm run test:sidebar -- --reporter=html
npx playwright show-report
```

### שמירת תוצאות
```bash
npm run test:sidebar -- --reporter=json > test-results.json
```

## ⚡ אופטימיזציה

### הרצה מהירה יותר
```bash
# רק בדיקות חשובות
npm run test:sidebar:integration

# עם פחות workers
npm run test:sidebar -- --workers=1
```

### שמירת זמן בפיתוח
```bash
# watch mode
npm run test:sidebar:watch
```

## 📚 למידה נוספת

- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
- [README.md](./README.md) - תיעוד מלא

## ✅ Checklist להתקנה

- [ ] התקנתי Node.js
- [ ] התקנתי את הפרויקט (`npm install`)
- [ ] התקנתי Playwright (`npm install -D @playwright/test`)
- [ ] התקנתי browsers (`npx playwright install`)
- [ ] הרצתי את הבדיקות (`npm run test:sidebar`)
- [ ] כל הבדיקות עוברות ✅
- [ ] קראתי את התיעוד

## 🎉 סיימת!

המערכת מותקנת ופועלת. כעת אתה יכול:
- להריץ בדיקות בכל עת
- להוסיף בדיקות חדשות
- לשלב ב-CI/CD
- לעקוב אחר איכות הקוד

**בהצלחה! 🚀**
