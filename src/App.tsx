import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UndoRedoProvider } from "@/hooks/useUndoRedo";
import { BackupProvider } from "@/hooks/useBackupRestore";
import { AuthProvider } from "@/hooks/useAuth";
import { TimerProvider } from "@/hooks/useTimer";
import { ThemeProvider } from "@/hooks/useTheme";
import { CloudSyncProvider } from "@/components/CloudSyncProvider";
import { DataSyncInitializer } from "@/components/DataSyncInitializer";
import { UnifiedDevTools } from "@/components/dev-tools/UnifiedDevTools";
import { FullPageLoader } from "@/components/ui/loading";
import { PWAInstallBanner, PWAUpdatePrompt, OfflineIndicator } from "@/components/pwa";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AutoPreload } from "@/components/AutoPreload";


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
const TasksAndMeetings = lazy(() => import("./pages/TasksAndMeetings"));
const Reminders = lazy(() => import("./pages/Reminders"));
const CustomTableView = lazy(() => import("./pages/CustomTableView"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const Finance = lazy(() => import("./pages/Finance"));
const History = lazy(() => import("./pages/History"));
const MyDay = lazy(() => import("./pages/MyDay"));
const TimeAnalytics = lazy(() => import("./pages/TimeAnalytics"));
const Quotes = lazy(() => import("./pages/Quotes"));
// Contracts moved into Quotes page as a tab
const Gmail = lazy(() => import("./pages/Gmail"));
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

// Optimized QueryClient with aggressive caching and performance settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache time
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnReconnect: 'always', // Refetch when connection restored
      retry: 2, // Retry twice on failure
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      networkMode: 'offlineFirst', // Use cache first when offline
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <DataSyncInitializer />
              <CloudSyncProvider>
                <TimerProvider>
                  <UndoRedoProvider>
                    <BackupProvider>
                      <Toaster />
                      <Sonner />
                    <BrowserRouter
                      future={{
                        v7_startTransition: true,
                        v7_relativeSplatPath: true,
                      }}
                    >
                      <Suspense fallback={<FullPageLoader />}>
                        <Routes>
                          <Route path="/" element={<Index />} />
                          <Route path="/auth" element={<Auth />} />
                          <Route path="/clients" element={<Clients />} />
                          <Route path="/employees" element={<Employees />} />
                          <Route path="/calendar" element={<Calendar />} />
                          <Route path="/reports" element={<Reports />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/backups" element={<Backups />} />
                          <Route path="/time-logs" element={<TimeLogs />} />
                          <Route path="/datatable-pro" element={<DataTablePro />} />
                          <Route path="/client-portal" element={<ClientPortal />} />
                          <Route path="/client-portal/messages" element={<ClientMessages />} />
                          <Route path="/client-portal/files" element={<ClientFiles />} />
                          <Route path="/client-portal/projects" element={<ClientProjects />} />
                          <Route path="/tasks-meetings" element={<TasksAndMeetings />} />
                          <Route path="/meetings" element={<TasksAndMeetings />} />
                          <Route path="/tasks" element={<TasksAndMeetings />} />
                          <Route path="/reminders" element={<Reminders />} />
                          <Route path="/custom-table/:tableId" element={<CustomTableView />} />
                          <Route path="/client-profile/:clientId" element={<ClientProfile />} />
                          <Route path="/finance" element={<Finance />} />
                          <Route path="/history" element={<History />} />
                          <Route path="/my-day" element={<MyDay />} />
                          <Route path="/time-analytics" element={<TimeAnalytics />} />
                          <Route path="/quotes" element={<Quotes />} />
                          {/* Contracts integrated into Quotes page */}
                          <Route path="/gmail" element={<Gmail />} />
                          <Route path="/files" element={<Files />} />
                          {/* Redirect old advanced-files to unified files page */}
                          <Route path="/advanced-files" element={<Files />} />
                          <Route path="/email-analytics" element={<EmailAnalytics />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="/audit-log" element={<AuditLogPage />} />
                          <Route path="/quote-templates" element={<QuoteTemplates />} />
                          {/* V2 Advanced Features */}
                          <Route path="/kanban" element={<TasksKanban />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/workflows" element={<Workflows />} />
                          <Route path="/tests" element={<Tests />} />
                          <Route path="/custom-reports" element={<CustomReports />} />
                          <Route path="/documents" element={<Documents />} />
                          <Route path="/calls" element={<Calls />} />
                          <Route path="/smart-tools" element={<SmartTools />} />
                          <Route path="/document-editor" element={<DocumentEditorPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                      
                      <UnifiedDevTools />
                      
                      {/* Auto Preload - Background data prefetching */}
                      <AutoPreload />
                      
                      {/* PWA Components */}
                      <PWAInstallBanner />
                      <PWAUpdatePrompt />
                      <OfflineIndicator />
                    </BrowserRouter>
                  </BackupProvider>
                </UndoRedoProvider>
              </TimerProvider>
            </CloudSyncProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
