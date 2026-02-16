// Gmail Bulk Actions Bar - Actions for selected emails
import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tag,
  Flag,
  FolderOpen,
  Folder,
  X,
  Archive,
  MailOpen,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GmailMessage } from "@/hooks/useGmailIntegration";
import { Client, EmailLabel, Priority, PRIORITY_CONFIG } from "./gmail-types";

interface EmailFolder {
  id: string;
  name: string;
  color: string;
  email_count: number;
}

interface BulkActionsBarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  customLabels: EmailLabel[];
  onBulkAddLabel: (labelId: string) => void;
  onBulkSetPriority: (priority: Priority) => void;
  folders: EmailFolder[];
  onBulkMoveToFolder: (folderId: string) => void;
  onBulkArchive: () => void;
  onBulkMarkRead: () => void;
  onBulkSpam: () => void;
}

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  customLabels,
  onBulkAddLabel,
  onBulkSetPriority,
  folders,
  onBulkMoveToFolder,
  onBulkArchive,
  onBulkMarkRead,
  onBulkSpam,
}: BulkActionsBarProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Checkbox
        checked={selectedCount === totalCount}
        onCheckedChange={onSelectAll}
      />
      <span className="text-sm font-medium mr-2">{selectedCount} נבחרו</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Tag className="h-4 w-4 ml-2" />
            הוסף תווית
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rtl">
          {customLabels.map((label) => (
            <DropdownMenuItem
              key={label.id}
              onClick={() => onBulkAddLabel(label.id)}
            >
              <div className={cn("h-3 w-3 rounded-full ml-2", label.color)} />
              {label.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Flag className="h-4 w-4 ml-2" />
            קבע עדיפות
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rtl">
          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => onBulkSetPriority(key as Priority)}
            >
              {config.icon}
              <span className="mr-2">{config.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Move to folder */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 ml-2" />
            העבר לתיקייה
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rtl">
          {folders.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              אין תיקיות - צור תיקייה חדשה בפאנל השמאלי
            </div>
          ) : (
            folders.map((folder) => (
              <DropdownMenuItem
                key={folder.id}
                onClick={() => onBulkMoveToFolder(folder.id)}
              >
                <Folder
                  className="h-4 w-4 ml-2"
                  style={{ color: folder.color }}
                />
                {folder.name}
                {folder.email_count > 0 && (
                  <span className="mr-auto text-xs text-muted-foreground">
                    {folder.email_count}
                  </span>
                )}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-5" />

      {/* Batch API actions */}
      <Button variant="outline" size="sm" onClick={onBulkArchive}>
        <Archive className="h-4 w-4 ml-1" />
        ארכיון
      </Button>
      <Button variant="outline" size="sm" onClick={onBulkMarkRead}>
        <MailOpen className="h-4 w-4 ml-1" />
        סמן נקרא
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-500"
        onClick={onBulkSpam}
      >
        <ShieldAlert className="h-4 w-4 ml-1" />
        ספאם
      </Button>
    </div>
  );
}
