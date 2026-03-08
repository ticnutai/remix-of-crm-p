/**
 * מערכת בדיקות מרכזית לסיידבר
 * 
 * קובץ זה מרכז את כל הבדיקות והתצורה של הסיידבר
 * ומאפשר שימוש נוח במערכת הבדיקות
 */

// ייצוא תצורה
export { default as testConfig } from './test-config.json';

// Types
export interface NavItem {
  title: string;
  url: string;
  testId: string;
  icon?: string;
  color?: string;
  canAddTable?: boolean;
}

export interface SidebarGesturesConfig {
  autoHideEnabled: boolean;
  autoHideDelay: number;
  hoverEnabled: boolean;
  pinRememberState: boolean;
  resizeEnabled: boolean;
  minWidth: number;
  maxWidth: number;
}

export interface SidebarTheme {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  hoverColor: string;
}

export interface CustomTable {
  id: string;
  name: string;
  singular_name?: string;
  icon?: string;
  visible: boolean;
  created_at?: string;
}

// Constants
export const MAIN_NAV_COUNT = 20;
export const SYSTEM_NAV_COUNT = 8;
export const TOTAL_NAV_COUNT = 28;

export const DEFAULT_SIDEBAR_CONFIG: SidebarGesturesConfig = {
  autoHideEnabled: true,
  autoHideDelay: 1000,
  hoverEnabled: true,
  pinRememberState: true,
  resizeEnabled: true,
  minWidth: 240,
  maxWidth: 480,
};

export const DEFAULT_SIDEBAR_THEME: SidebarTheme = {
  primaryColor: '#162C58',
  secondaryColor: '#d8ac27',
  textColor: '#ffffff',
  hoverColor: '#1E3A6E',
};

// Main Navigation Items
export const mainNavItems: NavItem[] = [
  { title: 'לוח בקרה', url: '/', testId: 'nav-dashboard' },
  { title: 'דשבורד מנהל', url: '/dashboard', testId: 'nav-admin-dashboard' },
  { title: 'היום שלי', url: '/my-day', testId: 'nav-my-day' },
  { title: 'לקוחות', url: '/clients', testId: 'nav-clients' },
  { title: 'טבלת לקוחות', url: '/datatable-pro', testId: 'nav-datatable-pro' },
  { title: 'עובדים', url: '/employees', testId: 'nav-employees' },
  { title: 'לוגי זמן', url: '/time-logs', testId: 'nav-time-logs' },
  { title: 'ניתוח זמנים', url: '/time-analytics', testId: 'nav-time-analytics' },
  { title: 'משימות ופגישות', url: '/tasks-meetings', testId: 'nav-tasks-meetings' },
  { title: 'לוח קנבן', url: '/kanban', testId: 'nav-kanban' },
  { title: 'תזכורות', url: '/reminders', testId: 'nav-reminders' },
  { title: 'הצעות מחיר', url: '/quotes', testId: 'nav-quotes' },
  { title: 'כספים', url: '/finance', testId: 'nav-finance' },
  { title: 'דוחות', url: '/reports', testId: 'nav-reports' },
  { title: 'דוחות מותאמים', url: '/custom-reports', testId: 'nav-custom-reports' },
  { title: 'לוח שנה', url: '/calendar', testId: 'nav-calendar' },
  { title: 'Gmail', url: '/gmail', testId: 'nav-gmail' },
  { title: 'קבצים', url: '/files', testId: 'nav-files' },
  { title: 'מסמכים', url: '/documents', testId: 'nav-documents' },
  { title: 'שיחות', url: '/calls', testId: 'nav-calls' },
];

// System Navigation Items
export const systemNavItems: NavItem[] = [
  { title: 'אוטומציות', url: '/workflows', testId: 'nav-workflows' },
  { title: 'אנליטיקס', url: '/analytics', testId: 'nav-analytics' },
  { title: 'לוג שינויים', url: '/audit-log', testId: 'nav-audit-log' },
  { title: 'תבניות הצעות', url: '/quote-templates', testId: 'nav-quote-templates' },
  { title: 'גיבויים וייבוא', url: '/backups', testId: 'nav-backups' },
  { title: 'היסטוריה', url: '/history', testId: 'nav-history' },
  { title: 'הגדרות', url: '/settings', testId: 'nav-settings' },
  { title: 'עזרה', url: '/help', testId: 'nav-help' },
];

// Utility Functions
export function getAllNavItems(): NavItem[] {
  return [...mainNavItems, ...systemNavItems];
}

export function findNavItemByUrl(url: string): NavItem | undefined {
  return getAllNavItems().find(item => item.url === url);
}

export function findNavItemByTestId(testId: string): NavItem | undefined {
  return getAllNavItems().find(item => item.testId === testId);
}

export function validateNavItem(item: NavItem): boolean {
  return !!(
    item.title &&
    item.url &&
    item.testId &&
    item.url.startsWith('/') &&
    item.testId.startsWith('nav-')
  );
}

export function checkDuplicateUrls(items: NavItem[]): string[] {
  const urls = items.map(item => item.url);
  const duplicates: string[] = [];
  const seen = new Set<string>();
  
  urls.forEach(url => {
    if (seen.has(url)) {
      duplicates.push(url);
    } else {
      seen.add(url);
    }
  });
  
  return duplicates;
}

export function checkDuplicateTitles(items: NavItem[]): string[] {
  const titles = items.map(item => item.title);
  const duplicates: string[] = [];
  const seen = new Set<string>();
  
  titles.forEach(title => {
    if (seen.has(title)) {
      duplicates.push(title);
    } else {
      seen.add(title);
    }
  });
  
  return duplicates;
}

export function checkDuplicateTestIds(items: NavItem[]): string[] {
  const testIds = items.map(item => item.testId);
  const duplicates: string[] = [];
  const seen = new Set<string>();
  
  testIds.forEach(testId => {
    if (seen.has(testId)) {
      duplicates.push(testId);
    } else {
      seen.add(testId);
    }
  });
  
  return duplicates;
}

export function validateAllNavItems(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const allItems = getAllNavItems();
  
  // Check count
  if (allItems.length !== TOTAL_NAV_COUNT) {
    errors.push(`Expected ${TOTAL_NAV_COUNT} items, got ${allItems.length}`);
  }
  
  // Check duplicates
  const duplicateUrls = checkDuplicateUrls(allItems);
  if (duplicateUrls.length > 0) {
    errors.push(`Duplicate URLs: ${duplicateUrls.join(', ')}`);
  }
  
  const duplicateTitles = checkDuplicateTitles(allItems);
  if (duplicateTitles.length > 0) {
    errors.push(`Duplicate titles: ${duplicateTitles.join(', ')}`);
  }
  
  const duplicateTestIds = checkDuplicateTestIds(allItems);
  if (duplicateTestIds.length > 0) {
    errors.push(`Duplicate testIds: ${duplicateTestIds.join(', ')}`);
  }
  
  // Check validity
  allItems.forEach((item, index) => {
    if (!validateNavItem(item)) {
      errors.push(`Invalid item at index ${index}: ${item.title}`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Custom Table Utilities
export function validateCustomTable(table: CustomTable): boolean {
  return !!(
    table.id &&
    table.name &&
    typeof table.visible === 'boolean'
  );
}

export function getCustomTableUrl(tableId: string): string {
  return `/custom/${tableId}`;
}

export function isCustomTableUrl(url: string): boolean {
  return url.startsWith('/custom/');
}

export function checkCustomTableConflicts(
  customTableIds: string[],
  navItems: NavItem[] = getAllNavItems()
): string[] {
  const conflicts: string[] = [];
  const navUrls = navItems.map(item => item.url);
  
  customTableIds.forEach(id => {
    const customUrl = getCustomTableUrl(id);
    if (navUrls.includes(customUrl)) {
      conflicts.push(id);
    }
  });
  
  return conflicts;
}

// Summary function
export function getSidebarSummary() {
  return {
    mainNavCount: mainNavItems.length,
    systemNavCount: systemNavItems.length,
    totalNavCount: getAllNavItems().length,
    validation: validateAllNavItems(),
    config: DEFAULT_SIDEBAR_CONFIG,
    theme: DEFAULT_SIDEBAR_THEME,
  };
}

// Default export
export default {
  mainNavItems,
  systemNavItems,
  getAllNavItems,
  findNavItemByUrl,
  findNavItemByTestId,
  validateNavItem,
  validateAllNavItems,
  getSidebarSummary,
  MAIN_NAV_COUNT,
  SYSTEM_NAV_COUNT,
  TOTAL_NAV_COUNT,
  DEFAULT_SIDEBAR_CONFIG,
  DEFAULT_SIDEBAR_THEME,
};
