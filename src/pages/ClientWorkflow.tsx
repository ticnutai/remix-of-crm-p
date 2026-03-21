// Client Portal - Workflow Tasks Page
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  Building2,
  User,
  Upload,
  FileText,
  Download,
  Timer,
  ChevronDown,
  ChevronUp,
  Eye,
  Paperclip,
} from "lucide-react";
import { format, differenceInSeconds, differenceInDays } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import PortalNavigation from "@/components/client-portal/PortalNavigation";

interface FolderStage {
  id: string;
  folder_id: string;
  stage_name: string;
  stage_icon: string | null;
  sort_order: number | null;
  target_working_days: number | null;
  started_at: string | null;
}

interface FolderTask {
  id: string;
  stage_id: string;
  title: string;
  completed: boolean;
  completed_at: string | null;
  sort_order: number | null;
  started_at: string | null;
  target_working_days: number | null;
  task_owner: string;
  office_timer_started_at: string | null;
  office_timer_total_seconds: number;
  client_timer_started_at: string | null;
  client_timer_total_seconds: number;
}

interface Folder {
  id: string;
  folder_name: string;
  folder_icon: string | null;
  sort_order: number | null;
  stages: FolderStage[];
}

interface TaskFile {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
}

export default function ClientWorkflow() {
  const { user, isClient, isLoading, clientId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tasks, setTasks] = useState<Record<string, FolderTask[]>>({});
  const [taskFiles, setTaskFiles] = useState<Record<string, TaskFile[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "timeline">("list");
  const [now, setNow] = useState(new Date());

  // Update timer display every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
    else if (!isLoading && user && !isClient) navigate("/");
  }, [isLoading, user, isClient, navigate]);

  useEffect(() => {
    if (clientId) fetchData();
  }, [clientId]);

  const fetchData = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // Fetch folders
      const { data: foldersData } = await (supabase as any)
        .from("client_folders")
        .select("id, folder_name, folder_icon, sort_order")
        .eq("client_id", clientId)
        .order("sort_order");

      if (!foldersData || foldersData.length === 0) {
        setFolders([]);
        setLoading(false);
        return;
      }

      const folderIds = foldersData.map((f: any) => f.id);

      // Fetch stages
      const { data: stagesData } = await (supabase as any)
        .from("client_folder_stages")
        .select("*")
        .in("folder_id", folderIds)
        .order("sort_order");

      const foldersWithStages = foldersData.map((f: any) => ({
        ...f,
        stages: (stagesData || []).filter((s: any) => s.folder_id === f.id),
      }));
      setFolders(foldersWithStages);

      // Expand all stages by default
      const allStageIds = new Set<string>((stagesData || []).map((s: any) => s.id));
      setExpandedStages(allStageIds);

      // Fetch tasks
      if (stagesData && stagesData.length > 0) {
        const stageIds = stagesData.map((s: any) => s.id);
        const { data: tasksData } = await (supabase as any)
          .from("client_folder_tasks")
          .select("*")
          .in("stage_id", stageIds)
          .order("sort_order");

        const tasksByStage: Record<string, FolderTask[]> = {};
        (tasksData || []).forEach((t: any) => {
          if (!tasksByStage[t.stage_id]) tasksByStage[t.stage_id] = [];
          tasksByStage[t.stage_id].push(t);
        });
        setTasks(tasksByStage);

        // Fetch files for all tasks
        if (tasksData && tasksData.length > 0) {
          const taskIds = tasksData.map((t: any) => t.id);
          const { data: filesData } = await (supabase as any)
            .from("client_task_files")
            .select("*")
            .in("task_id", taskIds)
            .order("created_at", { ascending: false });

          const filesByTask: Record<string, TaskFile[]> = {};
          (filesData || []).forEach((f: any) => {
            if (!filesByTask[f.task_id]) filesByTask[f.task_id] = [];
            filesByTask[f.task_id].push(f);
          });
          setTaskFiles(filesByTask);
        }
      }
    } catch (err) {
      console.error("Error fetching workflow:", err);
    }
    setLoading(false);
  };

  const getElapsedSeconds = useCallback(
    (task: FolderTask, side: "office" | "client") => {
      const base =
        side === "office"
          ? task.office_timer_total_seconds
          : task.client_timer_total_seconds;
      const startedAt =
        side === "office"
          ? task.office_timer_started_at
          : task.client_timer_started_at;
      if (!startedAt) return base;
      const elapsed = differenceInSeconds(now, new Date(startedAt));
      return base + Math.max(0, elapsed);
    },
    [now]
  );

  const formatTimer = (totalSeconds: number) => {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days} ימים ${hours} שעות`;
    if (hours > 0) return `${hours}:${String(mins).padStart(2, "0")} שעות`;
    return `${mins} דקות`;
  };

  const handleCompleteTask = async (task: FolderTask) => {
    if (task.task_owner !== "client" || task.completed) return;

    try {
      // Stop client timer and mark completed
      const clientTotal = getElapsedSeconds(task, "client");
      await (supabase as any)
        .from("client_folder_tasks")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
          client_timer_started_at: null,
          client_timer_total_seconds: clientTotal,
        })
        .eq("id", task.id);

      toast({ title: "✅ המשימה הושלמה!", description: task.title });
      fetchData();
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להשלים את המשימה",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (taskId: string, file: File) => {
    if (!clientId) return;

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `client-tasks/${clientId}/${taskId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("client-files")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("client-files")
        .getPublicUrl(filePath);

      await (supabase as any).from("client_task_files").insert({
        task_id: taskId,
        client_id: clientId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: "client",
      });

      toast({ title: "📎 הקובץ הועלה בהצלחה", description: file.name });
      fetchData();
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעלות את הקובץ",
        variant: "destructive",
      });
    }
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) next.delete(stageId);
      else next.add(stageId);
      return next;
    });
  };

  const toggleFiles = (taskId: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const getTaskStatusInfo = (task: FolderTask) => {
    if (task.completed) {
      return {
        label: "הושלם",
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
      };
    }
    if (task.task_owner === "office") {
      return {
        label: "משימת משרד",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Building2 className="h-4 w-4 text-blue-600" />,
      };
    }
    return {
      label: "ממתין לך",
      color: "bg-amber-100 text-amber-800 border-amber-200",
      icon: <User className="h-4 w-4 text-amber-600" />,
    };
  };

  const getStageProgress = (stageId: string) => {
    const stageTasks = tasks[stageId] || [];
    if (stageTasks.length === 0) return 0;
    const completed = stageTasks.filter((t) => t.completed).length;
    return Math.round((completed / stageTasks.length) * 100);
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalTasks = Object.values(tasks).flat();
  const completedTasks = totalTasks.filter((t) => t.completed);
  const clientPendingTasks = totalTasks.filter(
    (t) => !t.completed && t.task_owner === "client"
  );
  const officePendingTasks = totalTasks.filter(
    (t) => !t.completed && t.task_owner === "office"
  );

  return (
    <div className="min-h-screen bg-muted/30 pb-20" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/client-portal")}
            >
              <ArrowLeft className="h-4 w-4 ml-1" />
              חזרה
            </Button>
            <h1 className="text-lg font-bold">התקדמות הפרויקט</h1>
          </div>
          <div className="flex gap-1">
            {(["list", "kanban", "timeline"] as const).map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode)}
                className="text-xs"
              >
                {mode === "list" ? "רשימה" : mode === "kanban" ? "לוח" : "ציר זמן"}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-green-700">
                {completedTasks.length}
              </div>
              <div className="text-xs text-green-600">הושלמו</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-amber-700">
                {clientPendingTasks.length}
              </div>
              <div className="text-xs text-amber-600">ממתינות לך</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-3 text-center">
              <div className="text-2xl font-bold text-blue-700">
                {officePendingTasks.length}
              </div>
              <div className="text-xs text-blue-600">משימות משרד</div>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">התקדמות כללית</span>
              <span className="text-sm text-muted-foreground">
                {completedTasks.length}/{totalTasks.length}
              </span>
            </div>
            <Progress
              value={
                totalTasks.length > 0
                  ? (completedTasks.length / totalTasks.length) * 100
                  : 0
              }
              className="h-3"
            />
          </CardContent>
        </Card>

        {/* View Modes */}
        {viewMode === "list" && (
          <div className="space-y-4">
            {folders.map((folder) => (
              <div key={folder.id} className="space-y-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  {folder.folder_icon && <span>{folder.folder_icon}</span>}
                  {folder.folder_name}
                </h2>
                {folder.stages.map((stage) => {
                  const isExpanded = expandedStages.has(stage.id);
                  const progress = getStageProgress(stage.id);
                  const stageTasks = tasks[stage.id] || [];

                  return (
                    <Card key={stage.id} className="overflow-hidden">
                      <div
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleStage(stage.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {stage.stage_icon && (
                            <span className="text-lg">{stage.stage_icon}</span>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {stage.stage_name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-muted-foreground">
                                {progress}%
                              </span>
                            </div>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {isExpanded && (
                        <div className="border-t divide-y">
                          {stageTasks.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                              אין משימות בשלב זה
                            </div>
                          ) : (
                            stageTasks.map((task) => {
                              const status = getTaskStatusInfo(task);
                              const files = taskFiles[task.id] || [];
                              const showFiles = expandedFiles.has(task.id);
                              const officeTime = getElapsedSeconds(task, "office");
                              const clientTime = getElapsedSeconds(task, "client");

                              return (
                                <div key={task.id} className="p-3 space-y-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                      {status.icon}
                                      <div className="flex-1 min-w-0">
                                        <div
                                          className={`text-sm font-medium ${
                                            task.completed
                                              ? "line-through text-muted-foreground"
                                              : ""
                                          }`}
                                        >
                                          {task.title}
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className={`text-[10px] mt-1 ${status.color}`}
                                        >
                                          {status.label}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      {files.length > 0 && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 w-7 p-0"
                                          onClick={() => toggleFiles(task.id)}
                                        >
                                          <Paperclip className="h-3.5 w-3.5" />
                                          <span className="text-[10px] mr-0.5">
                                            {files.length}
                                          </span>
                                        </Button>
                                      )}

                                      {!task.completed &&
                                        task.task_owner === "client" && (
                                          <Button
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() =>
                                              handleCompleteTask(task)
                                            }
                                          >
                                            <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                                            השלם
                                          </Button>
                                        )}
                                    </div>
                                  </div>

                                  {/* Timers */}
                                  <div className="flex gap-3 text-xs">
                                    <div
                                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                                        !task.completed &&
                                        task.task_owner === "office"
                                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      <Building2 className="h-3 w-3" />
                                      <Timer className="h-3 w-3" />
                                      <span>{formatTimer(officeTime)}</span>
                                      {!task.completed &&
                                        task.task_owner === "office" && (
                                          <span className="animate-pulse text-blue-500">
                                            ●
                                          </span>
                                        )}
                                    </div>
                                    <div
                                      className={`flex items-center gap-1 px-2 py-1 rounded ${
                                        !task.completed &&
                                        task.task_owner === "client"
                                          ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                                          : "text-muted-foreground"
                                      }`}
                                    >
                                      <User className="h-3 w-3" />
                                      <Timer className="h-3 w-3" />
                                      <span>{formatTimer(clientTime)}</span>
                                      {!task.completed &&
                                        task.task_owner === "client" && (
                                          <span className="animate-pulse text-amber-500">
                                            ●
                                          </span>
                                        )}
                                    </div>
                                    {task.target_working_days && (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>
                                          יעד: {task.target_working_days} ימים
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* File Upload for client tasks */}
                                  {!task.completed &&
                                    task.task_owner === "client" && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <label className="flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline">
                                          <Upload className="h-3 w-3" />
                                          העלאת קובץ
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file)
                                                handleFileUpload(task.id, file);
                                              e.target.value = "";
                                            }}
                                          />
                                        </label>
                                      </div>
                                    )}

                                  {/* Files list */}
                                  {showFiles && files.length > 0 && (
                                    <div className="mt-2 space-y-1 bg-muted/50 rounded-lg p-2">
                                      {files.map((file) => (
                                        <div
                                          key={file.id}
                                          className="flex items-center justify-between text-xs p-1.5 bg-background rounded"
                                        >
                                          <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                                            <span className="truncate">
                                              {file.file_name}
                                            </span>
                                            <Badge
                                              variant="outline"
                                              className="text-[9px] flex-shrink-0"
                                            >
                                              {file.uploaded_by === "client"
                                                ? "לקוח"
                                                : "משרד"}
                                            </Badge>
                                          </div>
                                          <a
                                            href={file.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-shrink-0"
                                          >
                                            <Download className="h-3.5 w-3.5 text-primary" />
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {viewMode === "kanban" && (
          <div className="grid grid-cols-3 gap-3">
            {/* Office column */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-blue-700 flex items-center gap-1 pb-1 border-b-2 border-blue-300">
                <Building2 className="h-4 w-4" /> משימות משרד
              </div>
              {officePendingTasks.map((task) => (
                <Card key={task.id} className="border-blue-200">
                  <CardContent className="p-2.5">
                    <div className="text-xs font-medium">{task.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Timer className="h-3 w-3" />
                      {formatTimer(getElapsedSeconds(task, "office"))}
                      <span className="animate-pulse text-blue-500">●</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Client column */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-amber-700 flex items-center gap-1 pb-1 border-b-2 border-amber-300">
                <User className="h-4 w-4" /> ממתינות לך
              </div>
              {clientPendingTasks.map((task) => (
                <Card key={task.id} className="border-amber-200">
                  <CardContent className="p-2.5">
                    <div className="text-xs font-medium">{task.title}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {formatTimer(getElapsedSeconds(task, "client"))}
                        <span className="animate-pulse text-amber-500">●</span>
                      </div>
                      <Button
                        size="sm"
                        className="h-5 text-[10px] px-2"
                        onClick={() => handleCompleteTask(task)}
                      >
                        השלם
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Completed column */}
            <div className="space-y-2">
              <div className="text-sm font-semibold text-green-700 flex items-center gap-1 pb-1 border-b-2 border-green-300">
                <CheckCircle2 className="h-4 w-4" /> הושלמו
              </div>
              {completedTasks.map((task) => (
                <Card key={task.id} className="border-green-200 opacity-70">
                  <CardContent className="p-2.5">
                    <div className="text-xs font-medium line-through">
                      {task.title}
                    </div>
                    {task.completed_at && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {format(new Date(task.completed_at), "dd/MM/yyyy", {
                          locale: he,
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {viewMode === "timeline" && (
          <div className="space-y-1">
            {folders.map((folder) =>
              folder.stages.map((stage, stageIdx) => {
                const stageTasks = tasks[stage.id] || [];
                const progress = getStageProgress(stage.id);
                const allCompleted = stageTasks.length > 0 && progress === 100;
                const hasActive = stageTasks.some((t) => !t.completed);

                return (
                  <div key={stage.id} className="flex gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          allCompleted
                            ? "bg-green-500 border-green-500"
                            : hasActive
                            ? "bg-amber-400 border-amber-400"
                            : "bg-muted border-muted-foreground/30"
                        }`}
                      />
                      {stageIdx <
                        folder.stages.length - 1 && (
                        <div className="w-0.5 flex-1 bg-border min-h-[40px]" />
                      )}
                    </div>

                    {/* Stage content */}
                    <div className="flex-1 pb-4">
                      <div className="text-sm font-medium flex items-center gap-1">
                        {stage.stage_icon && <span>{stage.stage_icon}</span>}
                        {stage.stage_name}
                        <Badge variant="outline" className="text-[10px] mr-2">
                          {progress}%
                        </Badge>
                      </div>
                      <div className="mt-1 space-y-1">
                        {stageTasks.map((task) => {
                          const status = getTaskStatusInfo(task);
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-xs"
                            >
                              {status.icon}
                              <span
                                className={
                                  task.completed
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }
                              >
                                {task.title}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] ${status.color}`}
                              >
                                {status.label}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {folders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                עדיין אין תיקי עבודה. המשרד יוסיף שלבים ומשימות בקרוב.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <PortalNavigation />
    </div>
  );
}
