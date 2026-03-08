/**
 * BulkFileUploader – Advanced file uploader with folder support,
 * progress tracking, pause/resume, and parallel uploads.
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { useChunkedUpload, UploadFileItem } from "@/hooks/useChunkedUpload";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Upload,
  FolderUp,
  Pause,
  Play,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  FileText,
  Folder,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

// --- Helpers ---

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatEta(seconds?: number): string {
  if (!seconds || seconds <= 0) return "";
  if (seconds < 60) return `${seconds} שניות`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} דקות`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h} שעות ${m} דקות`;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || ""))
    return "🖼️";
  if (["pdf"].includes(ext || "")) return "📄";
  if (["doc", "docx"].includes(ext || "")) return "📝";
  if (["xls", "xlsx"].includes(ext || "")) return "📊";
  if (["mp4", "mov", "avi"].includes(ext || "")) return "🎬";
  if (["mp3", "wav", "ogg"].includes(ext || "")) return "🎵";
  if (["zip", "rar", "7z"].includes(ext || "")) return "📦";
  return "📎";
}

interface BulkFileUploaderProps {
  clientId: string;
  userId: string;
  onComplete?: () => void;
}

export function BulkFileUploader({
  clientId,
  userId,
  onComplete,
}: BulkFileUploaderProps) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFileList, setShowFileList] = useState(true);

  const {
    session,
    overallProgress,
    speed,
    collectFiles,
    addFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    retryFailed,
    clearSession,
  } = useChunkedUpload({
    clientId,
    userId,
    concurrency: 3,
    onComplete: () => {
      onComplete?.();
    },
  });

  // --- File / Folder selection handlers ---

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const items = collectFiles(files);
      addFiles(items);
      if (e.target) e.target.value = "";
    },
    [collectFiles, addFiles],
  );

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const items = collectFiles(files);
      addFiles(items);
      if (e.target) e.target.value = "";
    },
    [collectFiles, addFiles],
  );

  // --- Drag and drop with folder support ---

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processEntry = useCallback(
    async (entry: FileSystemEntry, path: string = ""): Promise<File[]> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          (entry as FileSystemFileEntry).file((file) => {
            // Attach relative path
            Object.defineProperty(file, "webkitRelativePath", {
              value: path ? `${path}/${file.name}` : file.name,
              writable: false,
            });
            resolve([file]);
          });
        });
      } else if (entry.isDirectory) {
        const dirReader = (entry as FileSystemDirectoryEntry).createReader();
        const entries: FileSystemEntry[] = await new Promise((resolve) => {
          const allEntries: FileSystemEntry[] = [];
          const readBatch = () => {
            dirReader.readEntries((batch) => {
              if (batch.length === 0) {
                resolve(allEntries);
              } else {
                allEntries.push(...batch);
                readBatch();
              }
            });
          };
          readBatch();
        });

        const files: File[] = [];
        for (const child of entries) {
          const childPath = path ? `${path}/${entry.name}` : entry.name;
          const childFiles = await processEntry(child, childPath);
          files.push(...childFiles);
        }
        return files;
      }
      return [];
    },
    [],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const items = e.dataTransfer.items;
      if (!items) return;

      const allFiles: File[] = [];

      // Use webkitGetAsEntry for folder support
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) entries.push(entry);
      }

      for (const entry of entries) {
        const files = await processEntry(entry);
        allFiles.push(...files);
      }

      if (allFiles.length > 0) {
        const uploadItems = collectFiles(allFiles);
        addFiles(uploadItems);
      }
    },
    [processEntry, collectFiles, addFiles],
  );

  // --- Stats ---

  const pendingCount = session.files.filter(
    (f) => f.status === "pending",
  ).length;
  const uploadingCount = session.files.filter(
    (f) => f.status === "uploading",
  ).length;
  const completedCount = session.files.filter(
    (f) => f.status === "completed",
  ).length;
  const failedCount = session.files.filter((f) => f.status === "failed").length;
  const pausedCount = session.files.filter((f) => f.status === "paused").length;

  // Group files by folder
  const folderGroups = session.files.reduce<Record<string, UploadFileItem[]>>(
    (acc, file) => {
      const parts = file.relativePath.split("/");
      const folder =
        parts.length > 1 ? parts.slice(0, -1).join("/") : "קבצים בודדים";
      if (!acc[folder]) acc[folder] = [];
      acc[folder].push(file);
      return acc;
    },
    {},
  );

  const hasFiles = session.files.length > 0;
  const isIdle = session.status === "idle";
  const isUploading = session.status === "uploading";
  const isPaused = session.status === "paused";
  const isCompleted = session.status === "completed";
  const hasError = session.status === "error";

  return (
    <div className="space-y-4" dir="rtl">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 text-center
          ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-border/50 hover:border-primary/50 bg-muted/20"
          }
          ${isUploading ? "pointer-events-none opacity-60" : "cursor-pointer"}
        `}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <FolderUp className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-lg">גרור קבצים או תיקיות לכאן</p>
            <p className="text-sm text-muted-foreground mt-1">
              או לחץ על הכפתורים למטה לבחירה ידנית
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFolderSelect}
          className="hidden"
        />

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          בחר קבצים
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => folderInputRef.current?.click()}
          disabled={isUploading}
          className="gap-2"
        >
          <FolderUp className="h-4 w-4" />
          בחר תיקיות
        </Button>

        {hasFiles && isIdle && (
          <Button
            size="sm"
            onClick={startUpload}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white"
          >
            <Zap className="h-4 w-4" />
            התחל העלאה ({session.totalFiles} קבצים)
          </Button>
        )}

        {isUploading && (
          <Button
            size="sm"
            variant="outline"
            onClick={pauseUpload}
            className="gap-2 border-amber-500 text-amber-600 hover:bg-amber-50"
          >
            <Pause className="h-4 w-4" />
            השהה
          </Button>
        )}

        {isPaused && (
          <Button
            size="sm"
            onClick={resumeUpload}
            className="gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
          >
            <Play className="h-4 w-4" />
            המשך העלאה
          </Button>
        )}

        {failedCount > 0 && !isUploading && (
          <Button
            size="sm"
            variant="outline"
            onClick={retryFailed}
            className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4" />
            נסה שוב ({failedCount} נכשלו)
          </Button>
        )}

        {hasFiles && !isUploading && (
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSession}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            נקה
          </Button>
        )}
      </div>

      {/* Overall Progress */}
      {hasFiles && (
        <div className="space-y-2 bg-card border border-border/50 rounded-lg p-4">
          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-3">
              {completedCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-emerald-500 text-emerald-600 gap-1"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  {completedCount} הושלמו
                </Badge>
              )}
              {uploadingCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-600 gap-1"
                >
                  <Loader2 className="h-3 w-3 animate-spin" />
                  {uploadingCount} עולים
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-red-500 text-red-600 gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  {failedCount} נכשלו
                </Badge>
              )}
              {pendingCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingCount} ממתינים
                </Badge>
              )}
              {pausedCount > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-500 text-amber-600 gap-1"
                >
                  <Pause className="h-3 w-3" />
                  {pausedCount} מושהים
                </Badge>
              )}
            </div>
            <span className="text-muted-foreground">
              {formatBytes(session.uploadedBytes)} /{" "}
              {formatBytes(session.totalBytes)}
            </span>
          </div>

          {/* Progress Bar */}
          <Progress value={overallProgress} className="h-3" />

          {/* Speed + ETA */}
          {isUploading && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{overallProgress}%</span>
              <div className="flex items-center gap-3">
                {speed > 0 && (
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    {formatBytes(speed)}/שנ׳
                  </span>
                )}
                {session.eta && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatEta(session.eta)} נותרו
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Completion message */}
          {isCompleted && (
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-medium py-2">
              <CheckCircle2 className="h-5 w-5" />
              כל הקבצים הועלו בהצלחה!
            </div>
          )}
        </div>
      )}

      {/* File List (grouped by folder) */}
      {hasFiles && (
        <div className="space-y-1">
          <button
            onClick={() => setShowFileList(!showFileList)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showFileList ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {showFileList ? "הסתר רשימת קבצים" : "הצג רשימת קבצים"} (
            {session.totalFiles})
          </button>

          {showFileList && (
            <ScrollArea className="max-h-64 border border-border/30 rounded-lg">
              <div className="divide-y divide-border/20">
                {Object.entries(folderGroups).map(([folder, files]) => (
                  <div key={folder}>
                    {/* Folder header */}
                    {folder !== "קבצים בודדים" && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 text-sm font-medium sticky top-0">
                        <Folder className="h-4 w-4 text-amber-500" />
                        <span>{folder}</span>
                        <Badge variant="secondary" className="text-xs mr-auto">
                          {files.length}
                        </Badge>
                      </div>
                    )}
                    {/* Files in folder */}
                    {files.map((file) => (
                      <FileRow key={file.id} file={file} />
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}
    </div>
  );
}

// --- Individual file row ---

function FileRow({ file }: { file: UploadFileItem }) {
  const fileName = file.relativePath.split("/").pop() || file.relativePath;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/20 transition-colors">
      {/* Status icon */}
      <span className="w-5 text-center shrink-0">
        {file.status === "completed" && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}
        {file.status === "uploading" && (
          <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
        )}
        {file.status === "failed" && (
          <AlertCircle className="h-4 w-4 text-red-500" />
        )}
        {file.status === "pending" && (
          <Clock className="h-4 w-4 text-muted-foreground" />
        )}
        {file.status === "paused" && (
          <Pause className="h-4 w-4 text-amber-500" />
        )}
      </span>

      {/* File icon + name */}
      <span className="shrink-0">{getFileIcon(fileName)}</span>
      <span className="truncate flex-1 text-right" title={file.relativePath}>
        {fileName}
      </span>

      {/* Size */}
      <span className="text-xs text-muted-foreground shrink-0">
        {formatBytes(file.totalBytes)}
      </span>

      {/* Mini progress for current file */}
      {file.status === "uploading" && (
        <div className="w-16 shrink-0">
          <Progress value={file.progress} className="h-1.5" />
        </div>
      )}

      {/* Error message */}
      {file.status === "failed" && file.error && (
        <span
          className="text-xs text-red-500 truncate max-w-[120px]"
          title={file.error}
        >
          {file.error}
        </span>
      )}
    </div>
  );
}
