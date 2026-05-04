import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister, PERSIST_MAX_AGE } from "@/lib/queryPersister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UndoRedoProvider } from "@/hooks/useUndoRedo";
import { BackupProvider } from "@/hooks/useBackupRestore";
import { AuthProvider } from "@/hooks/useAuth";
import { TimerProvider } from "@/hooks/useTimer";
import { ThemeProvider } from "@/hooks/useTheme";
import { CloudSyncProvider } from "@/components/CloudSyncProvider";
import { DataSyncInitializer } from "@/components/DataSyncInitializer";
import { NetworkRecoveryInitializer } from "@/components/NetworkRecoveryInitializer";
import { UnifiedDevTools } from "@/components/dev-tools/UnifiedDevTools";
import { FullPageLoader } from "@/components/ui/loading";
import {
  PWAInstallBanner,
  PWAUpdatePrompt,
  OfflineIndicator,
} from "@/components/pwa";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { withErrorBoundary } from "@/components/RouteErrorBoundary";
import { DedupProvider } from "@/contexts/DedupContext";
import { AutoPreload } from "@/components/AutoPreload";
import { AttendanceFAB } from "@/components/attendance/AttendanceFAB";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Clients = lazy(() => import("./pages/Clients"));
const Employees = lazy(() => import("./pages/Employees"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Backups = lazy(() => import("./pages/Backups"));
const TimeLogs = lazy(() => import("./pages/TimeLogs"));
const DataTablePro = lazy(() => import("./pages/DataTablePro"));
const ClientPortal = lazy(() => import("./pages/ClientPortal"));
const ClientMessages = lazy(() => import("./pages/ClientMessages"));
const ClientFiles = lazy(() => import("./pages/ClientFiles"));
const ClientProjects = lazy(() => import("./pages/ClientProjects"));
const ClientMeetings = lazy(() => import("./pages/ClientMeetings"));
const ClientNotifications = lazy(() => import("./pages/ClientNotifications"));
const ClientSettings = lazy(() => import("./pages/ClientSettings"));
const ClientPayments = lazy(() => import("./pages/ClientPayments"));
const TasksAndMeetings = lazy(() => import("./pages/TasksAndMeetings"));
const ClientWorkflow = lazy(() => import("./pages/ClientWorkflow"));

const CustomTableView = lazy(() => import("./pages/CustomTableView"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const Finance = lazy(() => import("./pages/Finance"));
const Payments = lazy(() => import("./pages/Payments"));
const History = lazy(() => import("./pages/History"));
const MyDay = lazy(() => import("./pages/MyDay"));
const TimeAnalytics = lazy(() => import("./pages/TimeAnalytics"));
const Quotes = lazy(() => import("./pages/Quotes"));
// Contracts moved into Quotes page as a tab
const Gmail = lazy(() => import("./pages/Gmail"));
const Contacts = lazy(() => import("./pages/Contacts"));
const Files = lazy(() => import("./pages/Files"));
const AdvancedFiles = lazy(() => import("./pages/AdvancedFiles"));
const EmailAnalytics = lazy(() => import("./pages/EmailAnalytics"));
const Analytics = lazy(() => import("./pages/Analytics"));
const AuditLogPage = lazy(() => import("./pages/AuditLog"));
const QuoteTemplates = lazy(() => import("./pages/QuoteTemplates"));
const NotFound = lazy(() => import("./pages/NotFound"));

// V2 Features - Advanced Pages
const TasksKanban = lazy(() => import("./pages/TasksKanban"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Workflows = lazy(() => import("./pages/Workflows"));
const CustomReports = lazy(() => import("./pages/CustomReports"));
const Documents = lazy(() => import("./pages/Documents"));
const Calls = lazy(() => import("./pages/Calls"));
const Tests = lazy(() => import("./pages/Tests"));
const SmartTools = lazy(() => import("./pages/SmartTools"));
const DocumentEditorPage = lazy(() => import("./pages/DocumentEditorPage"));
const PlanningGIS = lazy(() => import("./pages/PlanningGIS"));
const PortalManagement = lazy(() => import("./pages/PortalManagement"));
const Attendance = lazy(() => import("./pages/Attendance"));
const AttendanceAdmin = lazy(() => import("./pages/AttendanceAdmin"));

// Optimized QueryClient with aggressive caching and performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache time
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnReconnect: "always", // Refetch when connection restored
      retry: 2, // Retry twice on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: "offlineFirst", // Use cache first when offline
    },
    mutations: {
      retry: 1,
      networkMode: "offlineFirst",
    },
  },
});

// IndexedDB persister — survives page refresh, 24h max age
const idbPersister = createIDBPersister();
const persistOptions = {
  persister: idbPersister,
  maxAge: PERSIST_MAX_AGE,
  buster: "v1", // Bump to invalidate all cached data
};

const App = () => {
  return (
    <ErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
      >
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <DataSyncInitializer />
              <NetworkRecoveryInitializer />
              <CloudSyncProvider>
                <TimerProvider>
                  <UndoRedoProvider>
                    <BackupProvider>
                      <DedupProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter
                          future={{
                            v7_startTransition: false,
                            v7_relativeSplatPath: true,
                          }}
                        >
                          <Suspense fallback={<FullPageLoader />}>
                            <Routes>
                              <Route
                                path="/"
                                element={withErrorBoundary(Index)}
                              />
                              <Route
                                path="/auth"
                                element={withErrorBoundary(Auth)}
                              />
                              <Route
                                path="/clients"
                                element={withErrorBoundary(Clients)}
                              />
                              <Route
                                path="/clients/:clientId"
                                element={withErrorBoundary(ClientProfile)}
                              />
                              <Route
                                path="/employees"
                                element={withErrorBoundary(Employees)}
                              />
                              <Route
                                path="/calendar"
                                element={withErrorBoundary(Calendar)}
                              />
                              <Route
                                path="/reports"
                                element={withErrorBoundary(Reports)}
                              />
                              <Route
                                path="/settings"
                                element={withErrorBoundary(Settings)}
                              />
                              <Route
                                path="/backups"
                                element={withErrorBoundary(Backups)}
                              />
                              <Route
                                path="/time-logs"
                                element={withErrorBoundary(TimeLogs)}
                              />
                              <Route
                                path="/datatable-pro"
                                element={withErrorBoundary(DataTablePro)}
                              />
                              <Route
                                path="/client-portal"
                                element={withErrorBoundary(ClientPortal)}
                              />
                              <Route
                                path="/client-portal/messages"
                                element={withErrorBoundary(ClientMessages)}
                              />
                              <Route
                                path="/client-portal/files"
                                element={withErrorBoundary(ClientFiles)}
                              />
                              <Route
                                path="/client-portal/projects"
                                element={withErrorBoundary(ClientProjects)}
                              />
                              <Route
                                path="/client-portal/meetings"
                                element={withErrorBoundary(ClientMeetings)}
                              />
                              <Route
                                path="/client-portal/notifications"
                                element={withErrorBoundary(ClientNotifications)}
                              />
                              <Route
                                path="/client-portal/settings"
                                element={withErrorBoundary(ClientSettings)}
                              />
                              <Route
                                path="/client-portal/payments"
                                element={withErrorBoundary(ClientPayments)}
                              />
                              <Route
                                path="/client-portal/workflow"
                                element={withErrorBoundary(ClientWorkflow)}
                              />
                              <Route
                                path="/tasks-meetings"
                                element={withErrorBoundary(TasksAndMeetings)}
                              />
                              <Route
                                path="/meetings"
                                element={withErrorBoundary(TasksAndMeetings)}
                              />
                              <Route
                                path="/tasks"
                                element={withErrorBoundary(TasksAndMeetings)}
                              />
                              <Route
                                path="/reminders"
                                element={withErrorBoundary(TasksAndMeetings)}
                              />
                              <Route
                                path="/custom-table/:tableId"
                                element={withErrorBoundary(CustomTableView)}
                              />
                              <Route
                                path="/client-profile/:clientId"
                                element={withErrorBoundary(ClientProfile)}
                              />
                              <Route
                                path="/finance"
                                element={withErrorBoundary(Finance)}
                              />
                              <Route
                                path="/payments"
                                element={withErrorBoundary(Payments)}
                              />
                              <Route
                                path="/history"
                                element={withErrorBoundary(History)}
                              />
                              <Route
                                path="/my-day"
                                element={withErrorBoundary(MyDay)}
                              />
                              <Route
                                path="/time-analytics"
                                element={withErrorBoundary(TimeAnalytics)}
                              />
                              <Route
                                path="/quotes"
                                element={withErrorBoundary(Quotes)}
                              />
                              {/* Contracts integrated into Quotes page */}
                              <Route
                                path="/gmail"
                                element={withErrorBoundary(Gmail)}
                              />
                              <Route
                                path="/contacts"
                                element={withErrorBoundary(Contacts)}
                              />
                              <Route
                                path="/files"
                                element={withErrorBoundary(Files)}
                              />
                              {/* Redirect old advanced-files to unified files page */}
                              <Route
                                path="/advanced-files"
                                element={withErrorBoundary(Files)}
                              />
                              <Route
                                path="/email-analytics"
                                element={withErrorBoundary(EmailAnalytics)}
                              />
                              <Route
                                path="/analytics"
                                element={withErrorBoundary(Analytics)}
                              />
                              <Route
                                path="/audit-log"
                                element={withErrorBoundary(AuditLogPage)}
                              />
                              <Route
                                path="/quote-templates"
                                element={withErrorBoundary(QuoteTemplates)}
                              />
                              {/* V2 Advanced Features */}
                              <Route
                                path="/kanban"
                                element={withErrorBoundary(TasksKanban)}
                              />
                              <Route
                                path="/dashboard"
                                element={withErrorBoundary(Dashboard)}
                              />
                              <Route
                                path="/workflows"
                                element={withErrorBoundary(Workflows)}
                              />
                              <Route
                                path="/tests"
                                element={withErrorBoundary(Tests)}
                              />
                              <Route
                                path="/custom-reports"
                                element={withErrorBoundary(CustomReports)}
                              />
                              <Route
                                path="/documents"
                                element={withErrorBoundary(Documents)}
                              />
                              <Route
                                path="/calls"
                                element={withErrorBoundary(Calls)}
                              />
                              <Route
                                path="/smart-tools"
                                element={withErrorBoundary(SmartTools)}
                              />
                              <Route
                                path="/document-editor"
                                element={withErrorBoundary(DocumentEditorPage)}
                              />
                              <Route
                                path="/planning-gis"
                                element={withErrorBoundary(PlanningGIS)}
                              />
                              <Route
                                path="/portal-management"
                                element={withErrorBoundary(PortalManagement)}
                              />
                              <Route
                                path="/attendance"
                                element={withErrorBoundary(Attendance)}
                              />
                              <Route
                                path="/attendance/admin"
                                element={withErrorBoundary(AttendanceAdmin)}
                              />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </Suspense>

                          <UnifiedDevTools />

                          {/* Global Attendance Clock-in FAB */}
                          <AttendanceFAB />

                          {/* Auto Preload - Background data prefetching */}
                          <AutoPreload />

                          {/* PWA Components */}
                          <PWAInstallBanner />
                          <PWAUpdatePrompt />
                          <OfflineIndicator />
                        </BrowserRouter>
                      </DedupProvider>
                    </BackupProvider>
                  </UndoRedoProvider>
                </TimerProvider>
              </CloudSyncProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
