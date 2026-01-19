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
import { UnifiedDevTools } from "@/components/dev-tools/UnifiedDevTools";
import { FullPageLoader } from "@/components/ui/loading";

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
const DataImport = lazy(() => import("./pages/DataImport"));
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
const NotFound = lazy(() => import("./pages/NotFound"));

// Optimized QueryClient with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 30 * 60 * 1000, // 30 minutes - cache time (formerly cacheTime)
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Only retry once on failure
    },
  },
});

console.log('🚀 [App] Application starting...');
console.log('🌍 [App] Environment:', import.meta.env.MODE);

const App = () => {
  console.log('⚛️ [App] Rendering App component');
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AuthProvider>
            <CloudSyncProvider>
              <TimerProvider>
                <UndoRedoProvider>
                  <BackupProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
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
                          <Route path="/data-import" element={<DataImport />} />
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
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </Suspense>
                      <UnifiedDevTools />
                    </BrowserRouter>
                  </BackupProvider>
                </UndoRedoProvider>
              </TimerProvider>
            </CloudSyncProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
