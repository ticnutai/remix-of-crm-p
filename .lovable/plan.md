## מה כבר קיים
- בטבלאות `tasks`, `meetings`, `reminders` יש כבר עמודות שיוך: `assigned_to` (משימה), `attendees[]` (פגישה), `user_id` (תזכורת בעלים).
- ב-RLS: רוב המדיניות כבר מאפשרת רק לבעלים/משתויך לראות, ולאדמין/מנהל לראות הכל (חוץ מ"פרטי").
- יש `is_private` בכל 3 הטבלאות + סוויצ׳ "פרטי" ב-QuickAdd.
- אין UI לבחירת משתמש מבצע, ואין אייקון מתג "שלי / של כולם".
- ⚠️ קיימות 2 מדיניויות מסוכנות `Anyone can manage` על `tasks` ו-`reminders` שמבטלות בפועל את ההפרדה — חובה למחוק.

## מה ייווסף

### 1. תיקון אבטחה (Migration)
- מחיקת המדיניויות `Anyone can manage tasks` ו-`Anyone can manage reminders`.
- הוספת מדיניות UPDATE/DELETE לאדמין על `reminders` (כיום הוא לא יכול לשייך-מחדש תזכורת של משתמש אחר).
- ניקוי כפילות מדיניויות SELECT/UPDATE על `tasks`.
- התוצאה: עובד רגיל יראה רק את שיצר/שהוא משויך אליו; אדמין רואה את הכל (פרט ל"פרטי").

### 2. אייקון תצוגה לאדמין (UI)
בדפי `TasksAndMeetings` ו-`Reminders` יתווסף כפתור אייקון בכותרת שמופיע רק לאדמין:
- `Eye` = "כל המשתמשים" (ברירת מחדל לאדמין)
- `User` = "רק שלי"
- ההעדפה תישמר ב-`useSyncedSetting` תחת `tasks-view-scope` ו-`reminders-view-scope`.
- סינון יבוצע לפי `created_by`/`user_id` של המשתמש המחובר.

### 3. שדה "שייך אל" בדיאלוגי יצירה (Assignment)
- **QuickAddTask** — בורר משתמש (`assigned_to`). אדמין רואה את כל העובדים; עובד רגיל רואה רק את עצמו (ברירת מחדל = עצמו).
- **QuickAddMeeting** — בורר משתתפים מרובה (`attendees[]`).
- **AddReminderDialog** — בורר נמען (`user_id`) + אופציה "שלח גם אליי".

### 4. העברה / שיוך-מחדש מתוך פריט קיים
- ב-`EventPreviewDialog` יתווסף כפתור "העבר אל…" שפותח בורר עובד ומעדכן `assigned_to` / `attendees` / `user_id`.
- מותר רק לאדמין או ליוצר/בעלים.

### 5. מקור נתוני העובדים
שימוש בטבלת `profiles` (כל המשתמשים הפעילים והמאושרים) דרך הוק חדש קטן `useTeamMembers()` — לא קיים כיום, ייווצר.

## תרשים זרימה

```
[Admin]                              [Employee]
  ├─ Toggle Eye/User  ──┐              └─ Always sees only own
  │                     │
  ├─ Sees all / mine ──┘
  │
  └─ "Reassign" ─► picks user ─► UPDATE assigned_to/user_id/attendees
```

## פרטים טכניים
- שמות מפתחות: `tasks-view-scope`, `meetings-view-scope`, `reminders-view-scope` (ערכים: `mine` | `all`).
- הוק חדש: `src/hooks/useTeamMembers.ts` — שולף `profiles` שמאושרים, מחזיר `[{id, full_name, email}]`.
- לא נשנה את `useTasksOptimized/useMeetingsOptimized/useReminders` — הסינון יתבצע ב-UI כדי לא לשבור caches.
- כל הדיאלוגים ימשיכו להשתמש בעיצוב Navy/Gold הקיים.
