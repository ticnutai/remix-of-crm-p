export { RevenueChart } from './RevenueChart';
export { ProjectsStatusChart } from './ProjectsStatusChart';
export { WorkHoursChart } from './WorkHoursChart';
export { WorkHoursTableWidget } from './WorkHoursTableWidget';
export { DashboardThemeProvider, useDashboardTheme, dashboardThemes } from './DashboardThemeProvider';
export { DashboardSettingsDialog } from './DashboardSettingsDialog';
export { ThemedWidget, ThemedStatCard } from './ThemedWidget';
export { DynamicTableWidget } from './DynamicTableWidget';
export { DynamicStatsWidget } from './DynamicStatsWidget';
export { DraggableWidget, DraggableWidgetGrid } from './DraggableWidgetGrid';
// Unified Widget Layout System
export { 
  WidgetLayoutProvider, 
  useWidgetLayout, 
  SIZE_LABELS, 
  SIZE_GRID_CLASS,
  SIZE_WEIGHTS,
  GAP_CLASSES,
  GAP_LABELS,
  DEFAULT_LAYOUTS,
  type WidgetId,
  type WidgetSize,
  type WidgetLayout,
  type GridGap,
} from './WidgetLayoutManager';
export { WidgetContainer, WidgetGrid } from './WidgetContainer';
