# 📱 קומפוננטות מובייל - e-control CRM Pro

## 📦 קומפוננטות זמינות

### 1. MobileCard
כרטיס מותאם למובייל להצגת נתונים

```tsx
import { MobileCard } from '@/components/shared/mobile-index';
```

### 2. MobileResponsiveTable
מעבר אוטומטי בין טבלה לכרטיסים

```tsx
import { MobileResponsiveTable } from '@/components/shared/mobile-index';
```

### 3. MobileBottomNav
תפריט ניווט תחתון למובייל

```tsx
import { MobileBottomNav, BottomNavSpacer } from '@/components/shared/mobile-index';
```

### 4. FloatingActionButton
כפתור צף עם פעולות מרובות

```tsx
import { FloatingActionButton, MiniFAB } from '@/components/shared/mobile-index';
```

### 5. PullToRefresh
משיכה לרענון

```tsx
import { PullToRefresh, RefreshButton } from '@/components/shared/mobile-index';
```

### 6. SwipeableCard
כרטיס עם גסטורות החלקה

```tsx
import { SwipeableCard, SwipeableDeleteCard } from '@/components/shared/mobile-index';
```

### 7. ResponsiveDialog
דיאלוג מותאם אוטומטית

```tsx
import { ResponsiveDialog, MobileFullScreenDialog, ActionSheet } from '@/components/shared/mobile-index';
```

## 🔧 Hooks

### useIsMobile
בדיקה האם המכשיר מובייל

```tsx
import { useIsMobile } from '@/hooks/use-mobile';

const isMobile = useIsMobile(); // true/false
```

## 🎨 CSS Classes

### Responsive Text
```css
.text-responsive-xs
.text-responsive-sm
.text-responsive-base
.text-responsive-lg
.text-responsive-xl
```

### Responsive Spacing
```css
.p-responsive
.px-responsive
.py-responsive
```

### Mobile Optimized
```css
.card-mobile
.btn-mobile
.scroll-container
.active-scale
.table-mobile-scroll
```

## 📖 דוגמאות מהירות

### דף מלא עם מובייל
```tsx
import { 
  MobileCard, 
  MobileBottomNav, 
  BottomNavSpacer,
  PullToRefresh 
} from '@/components/shared/mobile-index';
import { useIsMobile } from '@/hooks/use-mobile';

function MyPage() {
  const isMobile = useIsMobile();

  return (
    <>
      <PullToRefresh onRefresh={fetchData}>
        <div className="p-responsive">
          {/* Content */}
        </div>
      </PullToRefresh>

      {isMobile && (
        <>
          <MobileBottomNav items={navItems} />
          <BottomNavSpacer />
        </>
      )}
    </>
  );
}
```

### כרטיסים עם החלקה
```tsx
import { SwipeableDeleteCard, MobileCard } from '@/components/shared/mobile-index';

<SwipeableDeleteCard 
  onDelete={handleDelete} 
  onEdit={handleEdit}
>
  <MobileCard
    title="לקוח"
    fields={[...]}
  />
</SwipeableDeleteCard>
```

### דיאלוג responsive
```tsx
import { ResponsiveDialog } from '@/components/shared/mobile-index';

<ResponsiveDialog
  open={open}
  onOpenChange={setOpen}
  title="כותרת"
  description="תיאור"
  footer={<Button>שמור</Button>}
>
  {/* Content */}
</ResponsiveDialog>
```

## 🚀 Best Practices

1. **תמיד השתמש ב-responsive classes**
2. **הוסף aria-labels לכפתורים**
3. **השתמש ב-active במקום hover**
4. **בדוק touch targets (44x44px מינימום)**
5. **הוסף loading states**

---

**למידע נוסף ראה:** [MOBILE_GUIDE.md](../../MOBILE_GUIDE.md)
