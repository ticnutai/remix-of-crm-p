/**
 * דוגמאות שימוש במערכת בדיקות הסיידבר
 * 
 * קובץ זה מראה איך להשתמש במערכת הבדיקות
 * בצורה פרוגרמטית בקוד שלך
 */

import sidebarTests, {
  mainNavItems,
  systemNavItems,
  getAllNavItems,
  findNavItemByUrl,
  validateAllNavItems,
  getSidebarSummary,
  checkCustomTableConflicts,
  type NavItem,
} from './index';

// ========================================
// דוגמה 1: קבלת כל הטאבים
// ========================================

console.log('=== כל הטאבים ===');
const allTabs = getAllNavItems();
console.log(`סך הכל: ${allTabs.length} טאבים`);
console.log('טאבים:', allTabs.map(t => t.title).join(', '));

// ========================================
// דוגמה 2: חיפוש טאב לפי URL
// ========================================

console.log('\n=== חיפוש טאב ===');
const clientsTab = findNavItemByUrl('/clients');
if (clientsTab) {
  console.log(`מצאתי: ${clientsTab.title}`);
  console.log(`URL: ${clientsTab.url}`);
  console.log(`Test ID: ${clientsTab.testId}`);
} else {
  console.log('לא נמצא');
}

// ========================================
// דוגמה 3: בדיקת תקינות כל המערכת
// ========================================

console.log('\n=== בדיקת תקינות ===');
const validation = validateAllNavItems();
if (validation.isValid) {
  console.log('✅ כל המערכת תקינה!');
} else {
  console.log('❌ נמצאו שגיאות:');
  validation.errors.forEach(error => console.log(`  - ${error}`));
}

// ========================================
// דוגמה 4: קבלת סיכום המערכת
// ========================================

console.log('\n=== סיכום המערכת ===');
const summary = getSidebarSummary();
console.log(`טאבים ראשיים: ${summary.mainNavCount}`);
console.log(`טאבים מערכת: ${summary.systemNavCount}`);
console.log(`סה"כ: ${summary.totalNavCount}`);
console.log(`תקין: ${summary.validation.isValid ? '✅' : '❌'}`);

// ========================================
// דוגמה 5: בדיקת קונפליקטים עם טבלאות מותאמות
// ========================================

console.log('\n=== בדיקת קונפליקטים ===');
const mockCustomTableIds = ['clients', 'my-custom-table', 'reports'];
const conflicts = checkCustomTableConflicts(mockCustomTableIds);
if (conflicts.length > 0) {
  console.log('⚠️  נמצאו קונפליקטים:');
  conflicts.forEach(id => console.log(`  - ${id}`));
} else {
  console.log('✅ אין קונפליקטים');
}

// ========================================
// דוגמה 6: סינון טאבים לפי קטגוריה
// ========================================

console.log('\n=== טאבים לפי קטגוריה ===');

// טאבי ניהול זמן
const timeTabs = mainNavItems.filter(
  item => item.title.includes('זמן') || item.title.includes('לוג')
);
console.log('טאבי זמן:', timeTabs.map(t => t.title).join(', '));

// טאבי לקוחות
const clientTabs = mainNavItems.filter(
  item => item.title.includes('לקוחות')
);
console.log('טאבי לקוחות:', clientTabs.map(t => t.title).join(', '));

// טאבי דוחות
const reportTabs = mainNavItems.filter(
  item => item.title.includes('דוחות')
);
console.log('טאבי דוחות:', reportTabs.map(t => t.title).join(', '));

// ========================================
// דוגמה 7: יצירת רשימת URLs לניווט
// ========================================

console.log('\n=== רשימת URLs ===');
const urls = getAllNavItems().map(item => item.url);
console.log('כל ה-URLs:');
urls.forEach(url => console.log(`  - ${url}`));

// ========================================
// דוגמה 8: בדיקה אם URL קיים במערכת
// ========================================

console.log('\n=== בדיקת קיום URL ===');
function urlExists(url: string): boolean {
  return getAllNavItems().some(item => item.url === url);
}

console.log('/clients קיים?', urlExists('/clients') ? '✅' : '❌');
console.log('/not-exist קיים?', urlExists('/not-exist') ? '✅' : '❌');

// ========================================
// דוגמה 9: יצירת breadcrumbs
// ========================================

console.log('\n=== Breadcrumbs ===');
function createBreadcrumbs(url: string): string {
  const tab = findNavItemByUrl(url);
  if (!tab) return 'דף הבית';
  return `דף הבית > ${tab.title}`;
}

console.log(createBreadcrumbs('/clients'));
console.log(createBreadcrumbs('/settings'));
console.log(createBreadcrumbs('/unknown'));

// ========================================
// דוגמה 10: טיפול ב-Navigation Guards
// ========================================

console.log('\n=== Navigation Guards ===');
function canNavigate(url: string, userRole: 'admin' | 'user'): boolean {
  const tab = findNavItemByUrl(url);
  if (!tab) return false;
  
  // טאבי מערכת רק למנהלים
  const isSystemTab = systemNavItems.some(item => item.url === url);
  if (isSystemTab && userRole !== 'admin') {
    return false;
  }
  
  return true;
}

console.log('Admin -> /settings:', canNavigate('/settings', 'admin') ? '✅' : '❌');
console.log('User -> /settings:', canNavigate('/settings', 'user') ? '✅' : '❌');
console.log('User -> /clients:', canNavigate('/clients', 'user') ? '✅' : '❌');

// ========================================
// דוגמה 11: מיפוי testIds לשימוש ב-tests
// ========================================

console.log('\n=== Test IDs ===');
const testIdsMap = getAllNavItems().reduce((map, item) => {
  map[item.url] = item.testId;
  return map;
}, {} as Record<string, string>);

console.log('Test IDs Map:', testIdsMap);

// ========================================
// דוגמה 12: בניית menu structure
// ========================================

console.log('\n=== Menu Structure ===');
interface MenuGroup {
  title: string;
  items: NavItem[];
}

const menuStructure: MenuGroup[] = [
  { title: 'ניווט ראשי', items: mainNavItems },
  { title: 'מערכת', items: systemNavItems },
];

menuStructure.forEach(group => {
  console.log(`\n${group.title}:`);
  group.items.forEach(item => {
    console.log(`  - ${item.title} (${item.url})`);
  });
});

// ========================================
// דוגמה 13: בדיקת duplicates מותאמת
// ========================================

console.log('\n=== בדיקת Duplicates מותאמת ===');
import {
  checkDuplicateUrls,
  checkDuplicateTitles,
  checkDuplicateTestIds,
} from './index';

const allItems = getAllNavItems();
const dupUrls = checkDuplicateUrls(allItems);
const dupTitles = checkDuplicateTitles(allItems);
const dupTestIds = checkDuplicateTestIds(allItems);

console.log('Duplicate URLs:', dupUrls.length > 0 ? dupUrls : 'None ✅');
console.log('Duplicate Titles:', dupTitles.length > 0 ? dupTitles : 'None ✅');
console.log('Duplicate TestIds:', dupTestIds.length > 0 ? dupTestIds : 'None ✅');

// ========================================
// סיכום
// ========================================

console.log('\n=== סיכום ===');
console.log('מערכת הבדיקות מאפשרת:');
console.log('✅ קבלת כל הטאבים');
console.log('✅ חיפוש וסינון');
console.log('✅ בדיקת תקינות');
console.log('✅ בדיקת קונפליקטים');
console.log('✅ יצירת navigation guards');
console.log('✅ בניית menu structure');
console.log('✅ ועוד...');
