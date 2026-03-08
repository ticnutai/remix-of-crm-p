export { RevenueChart } from './RevenueChart';
export { ProjectsStatusChart } from './ProjectsStatusChart';
export { WorkHoursChart } from './WorkHoursChart';
export { WorkHoursTableWidget } from './WorkHoursTableWidget';
export { DashboardThemeProvider, useDashboardTheme, dashboardThemes } from './DashboardThemeProvider';
export { WidgetManagerProvider, useWidgetManager, widgetPresets, type WidgetCategory } from './WidgetManager';
export { DashboardSettingsDialog } from './DashboardSettingsDialog';
export { ThemedWidget, ThemedStatCard } from './ThemedWidget';
export { DynamicTableWidget } from './DynamicTableWidget';
export { DynamicStatsWidget } from './DynamicStatsWidget';
export { DraggableWidget, DraggableWidgetGrid } from './DraggableWidgetGrid';
// New Widget Layout System
export { 
  WidgetLayoutProvider, 
  useWidgetLayout, 
  SIZE_LABELS, 
  SIZE_GRID_CLASS,
  DEFAULT_LAYOUTS,
  type WidgetId,
  type WidgetSize,
  type WidgetLayout,
} from './WidgetLayoutManager';
export { WidgetContainer, WidgetGrid } from './WidgetContainer';
