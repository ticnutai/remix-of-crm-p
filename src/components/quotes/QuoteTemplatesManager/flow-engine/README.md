# Flow Engine (V2) — Clean Pagination Pipeline

מנוע עימוד חדש, **מבודד לחלוטין** משאר המערכת. אין שום import מ-`paged-engine/`,
מ-`PagesPreviewTab`, מ-`PagedPreviewTab` או מהעורך עצמו.

## ארכיטקטורה — 3 שכבות נפרדות

```
QuoteTemplate (DB, ללא שינוי)
        │
        ▼
┌──────────────────────────────┐
│ serializer.ts                │  Layer 2
│  template + mergeData        │
│   → FlowDocument (JSON זורם) │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ renderer.ts                  │  Layer 3
│  FlowDocument → HTML זורם    │
│  + CSS Paged Media           │
└──────────────────────────────┘
        │
        ▼
┌──────────────────────────────┐
│ FlowPreviewTab.tsx           │  UI
│  Paged.js polyfill + iframe  │
│  כפתור הדפסה (PDF native)    │
└──────────────────────────────┘
```

## כללי הפרדה

- אסור לייבא קבצים מחוץ ל-`flow-engine/`, חוץ מ:
  - `../types` (QuoteTemplate בלבד, read-only)
  - shadcn UI (`@/components/ui/*`)
- אסור להזיז/לשנות אובייקטים של העורך הישן.
- ה-HTML שמיוצר תמיד **זורם** — אין `position: absolute`, אין תיבות עצמאיות.
- Header/Footer/Strips מוגדרים אך ורק דרך `@page { @top-center { content: element(...) } }`.

## למה זה פותר את הבלגן

המערכת הישנה: אוסף תיבות עם מיקומים → מנוע העימוד לא ידע איפה לשבור.
כאן: פסקאות זורמות → Paged.js יודע בדיוק מה Header, מה Footer, ואיפה לחתוך.
