import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Save,
  Download,
  Printer,
  FileUp,
  FileText,
  Undo,
  Redo,
  Eye,
  Edit3,
  Columns,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MoreVertical,
  FileInput,
  Layout,
  Send,
  Copy,
  Loader2,
} from 'lucide-react';
import { ViewMode } from './types';

interface EditorToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isDirty: boolean;
  isSaving: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave: () => void;
  onExportPDF?: () => void;
  onExportImage?: () => void;
  onPrint?: () => void;
  onImport?: (file: File) => void;
  onSend?: () => void;
  onDuplicate?: () => void;
  onNewDocument?: () => void;
  onTemplateSelect?: (templateId: string) => void;
  onSaveAsTemplate?: () => void;
  documentType?: 'quote' | 'contract';
  templates?: { id: string; name: string }[];
}

export function EditorToolbar({
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  isDirty,
  isSaving,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onExportPDF,
  onExportImage,
  onPrint,
  onImport,
  onSend,
  onDuplicate,
  onNewDocument,
  onTemplateSelect,
  onSaveAsTemplate,
  documentType = 'quote',
  templates = [],
}: EditorToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImport) {
      onImport(file);
      e.target.value = ''; // Reset input
    }
  };

  const viewModeButtons = [
    { mode: 'edit' as ViewMode, icon: Edit3, label: 'עריכה' },
    { mode: 'split' as ViewMode, icon: Columns, label: 'מפוצל' },
    { mode: 'preview' as ViewMode, icon: Eye, label: 'תצוגה מקדימה' },
  ];

  const scalePresets = [50, 75, 85, 100, 125, 150];

  return (
    <div className="flex items-center gap-2 p-2 bg-card border-b" dir="rtl">
      {/* File actions */}
      <div className="flex items-center gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.pdf,.xlsx,.csv"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* New / Template dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <FileText className="h-4 w-4" />
              קובץ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {onNewDocument && (
              <DropdownMenuItem onClick={onNewDocument}>
                <FileText className="h-4 w-4 ml-2" />
                {documentType === 'quote' ? 'הצעה חדשה' : 'חוזה חדש'}
              </DropdownMenuItem>
            )}
            {templates.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full">
                  <DropdownMenuItem>
                    <Layout className="h-4 w-4 ml-2" />
                    טען תבנית
                  </DropdownMenuItem>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="left">
                  {templates.map(t => (
                    <DropdownMenuItem key={t.id} onClick={() => onTemplateSelect?.(t.id)}>
                      {t.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {onSaveAsTemplate && (
              <DropdownMenuItem onClick={onSaveAsTemplate}>
                <FileInput className="h-4 w-4 ml-2" />
                שמור כתבנית
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {onImport && (
              <DropdownMenuItem onClick={handleImportClick}>
                <FileUp className="h-4 w-4 ml-2" />
                ייבא קובץ
              </DropdownMenuItem>
            )}
            {onDuplicate && (
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 ml-2" />
                שכפל מסמך
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDirty ? 'default' : 'outline'}
              size="sm"
              onClick={onSave}
              disabled={isSaving || !isDirty}
              className="gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              שמור
            </Button>
          </TooltipTrigger>
          <TooltipContent>שמור (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo / Redo */}
      {(onUndo || onRedo) && (
        <>
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canUndo}
                  onClick={onUndo}
                >
                  <Undo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>בטל (Ctrl+Z)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={!canRedo}
                  onClick={onRedo}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>בצע שוב (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* View mode toggle */}
      <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
        {viewModeButtons.map(({ mode, icon: Icon, label }) => (
          <Tooltip key={mode}>
            <TooltipTrigger asChild>
              <Button
                variant={viewMode === mode ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  'h-7 px-2 gap-1',
                  viewMode === mode && 'shadow-sm'
                )}
                onClick={() => onViewModeChange(mode)}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">{label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Zoom controls */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onZoomChange(Math.max(25, zoom - 10))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>הקטן</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-16 text-xs">
              {zoom}%
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {scalePresets.map(preset => (
              <DropdownMenuItem
                key={preset}
                onClick={() => onZoomChange(preset)}
              >
                {preset}%
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onZoomChange(100)}>
              <RotateCcw className="h-4 w-4 ml-2" />
              איפוס
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onZoomChange(Math.min(200, zoom + 10))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>הגדל</TooltipContent>
        </Tooltip>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export actions */}
      <div className="flex items-center gap-1">
        {onSend && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={onSend} className="gap-1">
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">שלח</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>שלח למייל</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>הדפס</TooltipContent>
        </Tooltip>

        {(onExportPDF || onExportImage) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Download className="h-4 w-4" />
                ייצא
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onExportPDF && (
                <DropdownMenuItem onClick={onExportPDF}>
                  <FileText className="h-4 w-4 ml-2" />
                  ייצא כ-PDF
                </DropdownMenuItem>
              )}
              {onExportImage && (
                <DropdownMenuItem onClick={onExportImage}>
                  <FileText className="h-4 w-4 ml-2" />
                  ייצא כתמונה
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
