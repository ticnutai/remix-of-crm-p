export interface BackupTableDefinition {
  table: string;
  label: string;
  group:
    | "core"
    | "work"
    | "stages"
    | "quotes"
    | "payments"
    | "inspection"
    | "custom";
}

/**
 * Ordered parent-before-child so IDs and relationships can be restored safely.
 * Keep this registry in sync with the automatic-backup and import-backup
 * functions when a new business module is introduced.
 */
export const BACKUP_TABLE_REGISTRY: BackupTableDefinition[] = [
  { table: "profiles", label: "פרופילים", group: "core" },
  { table: "employees", label: "עובדים", group: "core" },
  { table: "clients", label: "לקוחות", group: "core" },
  { table: "client_categories", label: "קטגוריות לקוחות", group: "core" },
  { table: "client_sources", label: "מקורות לקוחות", group: "core" },
  { table: "client_contacts", label: "אנשי קשר", group: "core" },
  { table: "projects", label: "פרויקטים", group: "work" },
  { table: "time_entries", label: "רישומי זמן", group: "work" },
  { table: "meetings", label: "פגישות", group: "work" },
  { table: "reminders", label: "תזכורות", group: "work" },

  { table: "stage_templates", label: "תבניות תהליכים", group: "stages" },
  {
    table: "stage_template_stages",
    label: "שלבים בתבניות",
    group: "stages",
  },
  {
    table: "stage_template_tasks",
    label: "משימות בתבניות שלבים",
    group: "stages",
  },
  {
    table: "client_process_categories",
    label: "סיווג לקוחות לקטגוריות תהליך",
    group: "stages",
  },
  { table: "client_stages", label: "שלבי לקוחות", group: "stages" },
  { table: "client_folder_stages", label: "שלבי תיקיות", group: "stages" },
  { table: "client_folder_tasks", label: "משימות תיקיות", group: "stages" },
  { table: "client_deadlines", label: "מועדי לקוחות", group: "stages" },
  { table: "deadline_templates", label: "תבניות מועדים", group: "stages" },

  {
    table: "quote_template_folders",
    label: "תיקיות תבניות הצעה",
    group: "quotes",
  },
  { table: "quote_templates", label: "תבניות הצעות מחיר", group: "quotes" },
  {
    table: "quote_template_versions",
    label: "גרסאות תבניות הצעה",
    group: "quotes",
  },
  { table: "quotes", label: "הצעות מחיר", group: "quotes" },
  { table: "quote_items", label: "פריטי הצעות מחיר", group: "quotes" },
  { table: "quote_payments", label: "תשלומי הצעות מחיר", group: "quotes" },
  { table: "saved_quotes", label: "הצעות מחיר שמורות", group: "quotes" },
  {
    table: "client_stage_tasks",
    label: "משימות בשלבי לקוחות",
    group: "stages",
  },
  {
    table: "saved_quote_payment_events",
    label: "אירועי תשלום בהצעות",
    group: "quotes",
  },
  { table: "qp_folders", label: "תיקיות עורך הצעות", group: "quotes" },
  { table: "qp_themes", label: "עיצובי הצעות", group: "quotes" },
  { table: "qp_documents", label: "מסמכי הצעות", group: "quotes" },
  { table: "qp_versions", label: "גרסאות מסמכי הצעות", group: "quotes" },
  { table: "contract_templates", label: "תבניות חוזים", group: "quotes" },
  { table: "contracts", label: "חוזים", group: "quotes" },
  { table: "contract_documents", label: "מסמכי חוזים", group: "quotes" },
  { table: "contract_amendments", label: "תיקוני חוזים", group: "quotes" },
  {
    table: "quote_client_creation_operations",
    label: "קישורי הצעה, לקוח וחוזה",
    group: "quotes",
  },

  { table: "invoices", label: "חשבוניות", group: "payments" },
  { table: "invoice_payments", label: "תשלומי חשבוניות", group: "payments" },
  { table: "payment_schedules", label: "לוחות תשלום", group: "payments" },
  { table: "payments", label: "תשלומים", group: "payments" },
  {
    table: "inspection_form_folders",
    label: "תיקיות טפסי בדיקה",
    group: "inspection",
  },
  {
    table: "inspection_form_templates",
    label: "תבניות טפסי בדיקה",
    group: "inspection",
  },
  {
    table: "inspection_form_template_steps",
    label: "שלבי תבניות בדיקה",
    group: "inspection",
  },
  {
    table: "inspection_form_runs",
    label: "טפסי בדיקה פעילים",
    group: "inspection",
  },
  {
    table: "inspection_form_run_steps",
    label: "שלבים בטפסים פעילים",
    group: "inspection",
  },
  // Tasks are after inspection runs because tasks may reference inspection_run_id.
  { table: "tasks", label: "משימות", group: "work" },
  {
    table: "client_payment_stages",
    label: "שלבי תשלום של לקוחות",
    group: "payments",
  },
  {
    table: "client_additional_payments",
    label: "תשלומים נוספים ללקוח",
    group: "payments",
  },

  { table: "client_custom_tabs", label: "טאבים מותאמים", group: "custom" },
  { table: "client_tab_columns", label: "עמודות טאבים", group: "custom" },
  { table: "client_tab_data", label: "נתוני טאבים", group: "custom" },
  { table: "client_tab_files", label: "קבצי טאבים", group: "custom" },
  { table: "custom_tables", label: "טבלאות מותאמות", group: "custom" },
  { table: "custom_table_data", label: "נתוני טבלאות", group: "custom" },
  {
    table: "custom_table_permissions",
    label: "הרשאות טבלאות",
    group: "custom",
  },
  { table: "table_custom_columns", label: "עמודות טבלאות", group: "custom" },
  { table: "app_settings", label: "הגדרות מערכת", group: "custom" },
  { table: "user_settings", label: "הגדרות משתמש", group: "custom" },
];

export const BACKUP_TABLE_NAMES = BACKUP_TABLE_REGISTRY.map(
  ({ table }) => table,
);

export const BACKUP_TOPIC_LABELS = Object.fromEntries(
  BACKUP_TABLE_REGISTRY.map(({ table, label }) => [table, label]),
) as Record<string, string>;

export const DEFAULT_BACKUP_TOPICS = Object.fromEntries(
  BACKUP_TABLE_NAMES.map((table) => [table, true]),
) as Record<string, boolean>;
