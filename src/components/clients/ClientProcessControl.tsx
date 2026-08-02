import React, { useMemo, useState } from "react";
import { Check, ChevronLeft, Layers, ListChecks, Settings2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TaskClientMessageButton } from "@/components/client-tabs/TaskClientMessageButton";
import { TaskElapsedDaysBadge } from "@/components/shared/TaskElapsedDaysBadge";
import { buildStageTaskElapsedStartMap } from "@/lib/stageTaskElapsed";

export interface ClientProcessStage {
  id: string;
  stageId: string;
  name: string;
  sortOrder: number;
  completed: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ClientProcessTask {
  id: string;
  stageId: string;
  title: string;
  completed: boolean;
  taskType?: string | null;
  checkMarked?: boolean | null;
  createdAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string | null;
}

export interface ClientProcessControlSettings {
  enabled: boolean;
  stagesToShow: number;
  tasksToShow: number;
  verticalScroll?: boolean;
  clientsPerRow?: number;
  pageScrollSpeed?: number;
}

interface ClientProcessControlProps {
  clientId: string;
  clientName: string;
  stages: ClientProcessStage[];
  tasks: ClientProcessTask[];
  settings: ClientProcessControlSettings;
  compact?: boolean;
  onSettingsChange: (settings: ClientProcessControlSettings) => void;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onToggleCheck: (taskId: string, marked: boolean) => Promise<void>;
  onOpenProcess: () => void;
}

export function ClientProcessControl({
  clientId,
  clientName,
  stages,
  tasks,
  settings,
  compact = false,
  onSettingsChange,
  onToggleTask,
  onToggleCheck,
  onOpenProcess,
}: ClientProcessControlProps) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const orderedStages = useMemo(
    () => [...stages].sort((a, b) => a.sortOrder - b.sortOrder),
    [stages],
  );
  const stageTaskElapsedStarts = useMemo(
    () =>
      buildStageTaskElapsedStartMap(
        orderedStages.map((stage) => ({
          stageId: stage.stageId,
          sortOrder: stage.sortOrder,
          createdAt: stage.createdAt,
          updatedAt: stage.updatedAt,
        })),
        tasks.map((task) => ({
          id: task.id,
          stageId: task.stageId,
          completed: task.completed,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        })),
      ),
    [orderedStages, tasks],
  );
  const stageHasTasks = (stage: ClientProcessStage) =>
    tasks.some((task) => task.stageId === stage.stageId);
  const isVisibleTask = (task: ClientProcessTask) =>
    task.taskType === "check" || !task.completed;
  const stageHasOpenTasks = (stage: ClientProcessStage) =>
    tasks.some(
      (task) =>
        task.stageId === stage.stageId &&
        task.taskType !== "check" &&
        !task.completed,
    );
  // The operational "current stage" is the first stage with unfinished work.
  // Stage completion flags are not populated consistently for older records,
  // so only use them as a fallback after checking the actual tasks.
  const activeStage =
    orderedStages.find(stageHasOpenTasks) ||
    orderedStages.find(
      (stage) => !stage.completed && stageHasTasks(stage),
    ) ||
    orderedStages.find((stage) => !stage.completed) ||
    orderedStages[orderedStages.length - 1] ||
    null;
  const activeTasks = activeStage
    ? tasks.filter((task) => task.stageId === activeStage.stageId)
    : [];
  const openTasks = activeTasks.filter(isVisibleTask);
  const stagesForPreview = useMemo(() => {
    let remainingTasks = settings.tasksToShow;

    return orderedStages
      .map((stage) => ({
        stage,
        openTasks: tasks.filter(
          (task) => task.stageId === stage.stageId && isVisibleTask(task),
        ),
      }))
      .filter(({ openTasks: stageTasks }) => stageTasks.length > 0)
      .slice(0, settings.stagesToShow)
      .map(({ stage, openTasks: stageTasks }) => {
        const visibleTasks = settings.verticalScroll !== false
          ? stageTasks
          : stageTasks.slice(0, Math.max(remainingTasks, 0));
        remainingTasks -= visibleTasks.length;
        return {
          stage,
          openTasks: visibleTasks,
          totalOpenTasks: stageTasks.length,
        };
      })
      .filter(({ openTasks: stageTasks }) => stageTasks.length > 0);
  }, [orderedStages, settings.stagesToShow, settings.tasksToShow, settings.verticalScroll, tasks]);

  if (!settings.enabled || orderedStages.length === 0) return null;

  const stop = (event: React.SyntheticEvent) => event.stopPropagation();

  const toggleTask = async (task: ClientProcessTask) => {
    setUpdatingTaskId(task.id);
    try {
      if (task.taskType === "check") {
        await onToggleCheck(task.id, !task.checkMarked);
      } else {
        await onToggleTask(task.id, !task.completed);
      }
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setShowSettings(false);
      }}
    >
      <div
        className={cn(
          "absolute z-30",
          compact ? "bottom-1.5 right-1.5" : "bottom-2 right-2",
        )}
        dir="rtl"
        onClick={stop}
        onMouseDown={stop}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-[#d4a843] bg-white/95 text-[#1e3a5f] shadow-md transition hover:bg-[#fef9ee]",
              compact ? "h-7 px-2 text-[10px]" : "h-8 px-2.5 text-xs",
            )}
            title={`מצב התהליך של ${clientName}`}
            onClick={() => setShowSettings(false)}
          >
            <Layers className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            <span className="max-w-28 truncate font-bold">
              {activeStage?.name || "ללא שלב פעיל"}
            </span>
            {activeStage && (
              <span className="rounded-full bg-[#1e3a5f] px-1.5 py-0.5 font-bold text-white">
                {openTasks.length}
              </span>
            )}
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        collisionPadding={12}
        className="w-[310px] max-w-[calc(100vw-24px)] resize-none overflow-hidden rounded-2xl border border-[#d4a843] bg-white p-0 text-right shadow-2xl"
        dir="rtl"
        onClick={stop}
        onMouseDown={stop}
      >
        <div className="flex items-center justify-between bg-[#1e3a5f] px-3 py-2.5 text-white">
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{clientName}</div>
            <div className="text-[11px] text-white/70">מרכז שליטה בתהליך</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-white/15"
              title="הגדרות תצוגה"
              onClick={() => setShowSettings((value) => !value)}
            >
              <Settings2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-white/15"
              title="סגירה"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showSettings ? (
          <div className="space-y-4 p-4 text-sm">
            <div>
              <label className="mb-1.5 block font-semibold">מספר שלבים להצגה</label>
              <select
                className="h-9 w-full rounded-lg border px-2"
                value={settings.stagesToShow}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    stagesToShow: Number(event.target.value),
                  })
                }
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-semibold">מספר משימות להצגה</label>
              <select
                className="h-9 w-full rounded-lg border px-2"
                value={settings.tasksToShow}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    tasksToShow: Number(event.target.value),
                  })
                }
              >
                {[1, 2, 3, 4, 5, 8, 10, 15, 20].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
              <span>
                <span className="block font-semibold">גלילה אנכית</span>
                <span className="block text-[11px] text-slate-500">
                  הצג את הכמות שנבחרה וגלול לשאר
                </span>
              </span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#1e3a5f]"
                checked={settings.verticalScroll !== false}
                onChange={(event) =>
                  onSettingsChange({
                    ...settings,
                    verticalScroll: event.target.checked,
                  })
                }
              />
            </label>
          </div>
        ) : (
          <>
            <div className="border-b bg-[#fef9ee] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[#1e3a5f]">
                    {activeStage?.name || "כל השלבים הושלמו"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    משימות פתוחות ובדיקות
                  </div>
                </div>
                <div className="rounded-full bg-white px-2 py-1 text-xs font-bold text-[#1e3a5f] shadow-sm">
                  {openTasks.length} פריטים
                </div>
              </div>
            </div>

            <div
              className={cn(
                "p-3",
                settings.verticalScroll !== false
                  ? "overflow-y-auto"
                  : "overflow-visible",
              )}
              style={
                settings.verticalScroll !== false
                  ? {
                      maxHeight: `min(60vh, ${Math.max(150, settings.tasksToShow * 48 + 54)}px)`,
                    }
                  : undefined
              }
            >
              {stagesForPreview.length === 0 ? (
                <div className="py-5 text-center text-sm text-slate-500">
                  אין משימות או בדיקות להצגה
                </div>
              ) : (
                <div className="space-y-3">
                  {stagesForPreview.map(({ stage, openTasks: stageTasks, totalOpenTasks }) => (
                    <section key={stage.id} className="space-y-1.5">
                      <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg bg-[#fef9ee] px-2.5 py-1.5 text-[#1e3a5f]">
                        <span className="truncate text-xs font-bold">{stage.name}</span>
                        <span className="shrink-0 rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold">
                          {totalOpenTasks} פתוחות
                        </span>
                      </div>
                      {stageTasks.map((task) => (
                        <div
                          key={task.id}
                          className="group/task flex w-full items-center gap-1 rounded-lg border border-slate-100 pr-2 transition hover:border-[#d4a843]/60 hover:bg-[#fef9ee]"
                        >
                          <button
                            type="button"
                            disabled={updatingTaskId === task.id}
                            className="flex min-w-0 flex-1 items-start gap-2 py-2 text-right disabled:opacity-60"
                            onClick={() => void toggleTask(task)}
                          >
                            <span
                              className={cn(
                                "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                task.taskType === "check"
                                  ? task.checkMarked
                                    ? "border-red-500 bg-red-500"
                                    : "border-emerald-500 bg-white"
                                  : "rounded border-slate-300 bg-white",
                              )}
                            >
                              {updatingTaskId === task.id && task.taskType !== "check" && (
                                <Check className="h-3 w-3 text-emerald-500" />
                              )}
                            </span>
                            <span
                              className={cn(
                                "text-xs",
                                task.taskType === "check" &&
                                  (task.checkMarked ? "text-red-600" : "text-emerald-600"),
                              )}
                            >
                              {task.title}
                            </span>
                          </button>
                          <TaskClientMessageButton
                            clientId={clientId}
                            taskId={task.id}
                            taskTitle={task.title}
                            stageName={stage.name}
                            className="ml-1 opacity-60 transition-opacity group-hover/task:opacity-100"
                          />
                          {stageTaskElapsedStarts[task.id] && (
                            <TaskElapsedDaysBadge
                              createdAt={stageTaskElapsedStarts[task.id]}
                              completedAt={task.completedAt}
                              updatedAt={task.updatedAt}
                              completed={task.completed}
                              compact
                            />
                          )}
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 border-t bg-slate-50 px-3 py-2.5 text-xs font-bold text-[#1e3a5f] hover:bg-[#fef9ee]"
              onClick={() => {
                setOpen(false);
                onOpenProcess();
              }}
            >
              <ListChecks className="h-4 w-4" />
              פתח את כל השלבים והמשימות
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
