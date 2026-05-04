# Persistence Audit — page by page

For each page, mark with ✓ when verified that all user-changeable UI state
(view mode, theme, dialog positions, filters, column widths, expanded sections, etc.)
is persisted to **both** localStorage (instant) and Supabase `user_settings` (cross-device).

Helper hook: `src/hooks/useSyncedSetting.ts` — drop-in replacement for `useState`
with key-based LS+cloud sync.

## Pages
- [ ] Dashboard
- [ ] Clients
- [ ] DataTablePro
- [ ] Finance
- [ ] Attendance / AttendanceAdmin
- [ ] MyDay
- [ ] Calendar
- [ ] TasksAndMeetings / TasksKanban / Reminders
- [ ] Employees
- [ ] Settings
- [ ] Quotes / QuoteTemplates
- [ ] Reports / CustomReports / Analytics / TimeAnalytics
- [ ] Backups
- [ ] Files / AdvancedFiles / Documents
- [ ] Workflows / SmartTools
- [ ] Contacts / Calls / Gmail / EmailAnalytics
- [ ] Payments / ClientPayments
- [ ] PlanningGIS
- [ ] PortalManagement / ClientPortal
- [ ] AuditLog / History / Tests

## Pattern checks per page
1. View toggles (table/kanban/grid/cards) → synced?
2. Theme/colors set per page → synced?
3. Dialog/Sheet/Popover positions → if draggable, persisted?
4. Filters (active filter set, search query) → synced?
5. Sort & column widths → synced?
6. Hidden/visible columns → synced?
7. Expanded/collapsed panels → synced?
8. Pagination size → synced?
