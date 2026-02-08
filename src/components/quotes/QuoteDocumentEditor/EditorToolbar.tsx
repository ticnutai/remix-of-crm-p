import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Save,
  Download,
  FileUp,
  FileText,
  Eye,
  Edit3,
  Columns,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Printer,
  ChevronDown,
  FileImage,
  FilePlus,
  FolderOpen,
  MessageCircle,
  Share2,
} from 'lucide-react';
import { ViewMode, QuoteDocumentData } from './types';
import { WhatsAppShareDialog } from './WhatsAppShareDialog';

interface EditorToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  isDirty: boolean;
  onSave: () => void;
  onExportPdf: () => void;
  onExportImage: () => void;
  onPrint: () => void;
  onImport: (file: File) => void;
  onNew: () => void;
  onLoadTemplate: () => void;
  onSaveAsTemplate: () => void;
  isSaving?: boolean;
  document?: QuoteDocumentData;
}

export function EditorToolbar({
  viewMode,
  onViewModeChange,
  scale,
  onScaleChange,
  isDirty,
  onSave,
  onExportPdf,
  onExportImage,
  onPrint,
  onImport,
  onNew,
  onLoadTemplate,
  onSaveAsTemplate,
  isSaving,
  document,
}: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ToolButton = ({ 
    icon: Icon, 
    label, 
    onClick, 
    disabled,
    active,
  }: { 
    icon: React.ComponentType<any>; 
    label: string; 
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div className="h-12 bg-card border-b flex items-center justify-between px-3" dir="rtl">
      {/* Left: File operations */}
      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <FileText className="h-4 w-4" />
              קובץ
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onNew}>
              <FilePlus className="h-4 w-4 ml-2" />
              מסמך חדש
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLoadTemplate}>
              <FolderOpen className="h-4 w-4 ml-2" />
              טען תבנית
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <FileUp className="h-4 w-4 ml-2" />
              ייבא מקובץ
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSave}>
              <Save className="h-4 w-4 ml-2" />
              שמור
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSaveAsTemplate}>
              <FileText className="h-4 w-4 ml-2" />
              שמור כתבנית
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton icon={Save} label="שמור" onClick={onSave} disabled={!isDirty || isSaving} />
        
        <Separator orientation="vertical" className="h-6 mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              ייצא
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onExportPdf}>
              <FileText className="h-4 w-4 ml-2" />
              ייצא ל-PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportImage}>
              <FileImage className="h-4 w-4 ml-2" />
              ייצא כתמונה
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="h-4 w-4 ml-2" />
              הדפס
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Center: View mode */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1"
          onClick={() => onViewModeChange('edit')}
        >
          <Edit3 className="h-3 w-3" />
          עריכה
        </Button>
        <Button
          variant={viewMode === 'split' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1"
          onClick={() => onViewModeChange('split')}
        >
          <Columns className="h-3 w-3" />
          מפוצל
        </Button>
        <Button
          variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-7 gap-1"
          onClick={() => onViewModeChange('preview')}
        >
          <Eye className="h-3 w-3" />
          תצוגה מקדימה
        </Button>
      </div>

      {/* Right: Zoom & Print */}
      <div className="flex items-center gap-1">
        <ToolButton 
          icon={ZoomOut} 
          label="הקטן" 
          onClick={() => onScaleChange(Math.max(0.25, scale - 0.1))} 
          disabled={scale <= 0.25}
        />
        <span className="text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
        <ToolButton 
          icon={ZoomIn} 
          label="הגדל" 
          onClick={() => onScaleChange(Math.min(2, scale + 0.1))} 
          disabled={scale >= 2}
        />
        <Button
          variant="ghost"
          size="sm"
          className="text-xs"
          onClick={() => onScaleChange(1)}
        >
          <RotateCcw className="h-3 w-3 ml-1" />
          100%
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolButton icon={Printer} label="הדפס" onClick={onPrint} />
        
        {/* WhatsApp Share */}
        {document && (
          <WhatsAppShareDialog document={document} />
        )}
        
        <Button onClick={onSave} disabled={!isDirty || isSaving} size="sm" className="mr-2">
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
          ) : (
            <Save className="h-4 w-4 ml-2" />
          )}
          שמור הצעה
        </Button>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.doc,.pdf"
        onChange={handleFileSelect}
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}
