// EditorToolbar - סרגל כלים לעורך החוזים המתקדם
import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FileText,
  Download,
  Printer,
  Eye,
  Edit,
  SplitSquareVertical,
  Palette,
  Layout,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  Sun,
  Moon,
  FileDown,
  FileType,
  FileImage,
  Archive,
  MoreVertical,
  Copy,
  Trash2,
  Settings,
  Share2,
} from 'lucide-react';
import { ColorScheme, DesignTemplate, ViewMode, COLOR_SCHEMES, DESIGN_TEMPLATES } from './types';

interface EditorToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  designTemplate: DesignTemplate;
  onDesignTemplateChange: (template: DesignTemplate) => void;
  darkMode: boolean;
  onDarkModeToggle: () => void;
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: (format: 'pdf' | 'html' | 'word' | 'zip') => void;
  onPrint?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  isDirty?: boolean;
  title?: string;
  onTitleChange?: (title: string) => void;
}

export function EditorToolbar({
  viewMode,
  onViewModeChange,
  colorScheme,
  onColorSchemeChange,
  designTemplate,
  onDesignTemplateChange,
  darkMode,
  onDarkModeToggle,
  onSave,
  onLoad,
  onExport,
  onPrint,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  isDirty = false,
  title,
  onTitleChange,
}: EditorToolbarProps) {
  const currentColorScheme = COLOR_SCHEMES[colorScheme];
  const currentTemplate = DESIGN_TEMPLATES[designTemplate];

  return (
    <div className="flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-2">
      {/* צד ימין - פעולות קובץ */}
      <div className="flex items-center gap-1">
        {/* תפריט קובץ */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">קובץ</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={onSave}>
              <Save className="h-4 w-4 ml-2" />
              שמירה
              {isDirty && <span className="mr-auto text-xs text-muted-foreground">(שינויים לא נשמרו)</span>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLoad}>
              <FolderOpen className="h-4 w-4 ml-2" />
              טעינת תבנית
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Download className="h-4 w-4 ml-2" />
                ייצוא
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                  <FileDown className="h-4 w-4 ml-2" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('html')}>
                  <FileType className="h-4 w-4 ml-2" />
                  HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport?.('word')}>
                  <FileImage className="h-4 w-4 ml-2" />
                  Word
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onExport?.('zip')}>
                  <Archive className="h-4 w-4 ml-2" />
                  ZIP (כל הפורמטים)
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={onPrint}>
              <Printer className="h-4 w-4 ml-2" />
              הדפסה
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Undo/Redo */}
        <div className="flex items-center border-r pr-2 mr-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="h-4 w-4" />
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
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>בצע שוב (Ctrl+Y)</TooltipContent>
          </Tooltip>
        </div>

        {/* כותרת המסמך */}
        {title !== undefined && (
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange?.(e.target.value)}
            className="font-medium text-sm bg-transparent border-none outline-none focus:ring-1 focus:ring-primary rounded px-2 py-1 min-w-[200px]"
            placeholder="שם החוזה..."
          />
        )}
      </div>

      {/* מרכז - מצב תצוגה */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 gap-2"
              onClick={() => onViewModeChange('edit')}
            >
              <Edit className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-xs">עריכה</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>מצב עריכה</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'split' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 gap-2"
              onClick={() => onViewModeChange('split')}
            >
              <SplitSquareVertical className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-xs">מפוצל</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>תצוגה מפוצלת</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 px-3 gap-2"
              onClick={() => onViewModeChange('preview')}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden md:inline text-xs">תצוגה</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>תצוגה מקדימה</TooltipContent>
        </Tooltip>
      </div>

      {/* צד שמאל - עיצוב */}
      <div className="flex items-center gap-1">
        {/* בורר ערכת צבעים */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ background: currentColorScheme.primary }}
              />
              <span className="hidden sm:inline">{currentColorScheme.label}</span>
              <Palette className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(COLOR_SCHEMES).map(([key, scheme]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onColorSchemeChange(key as ColorScheme)}
                className={colorScheme === key ? 'bg-accent' : ''}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ background: scheme.primary }}
                  />
                  <span>{scheme.label}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* בורר תבנית עיצוב */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">{currentTemplate.label}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {Object.entries(DESIGN_TEMPLATES).map(([key, template]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onDesignTemplateChange(key as DesignTemplate)}
                className={designTemplate === key ? 'bg-accent' : ''}
              >
                <div className="flex flex-col">
                  <span>{template.label}</span>
                  <span className="text-xs text-muted-foreground">{template.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* מצב כהה */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDarkModeToggle}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{darkMode ? 'מצב בהיר' : 'מצב כהה'}</TooltipContent>
        </Tooltip>

        {/* תפריט נוסף */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Copy className="h-4 w-4 ml-2" />
              שכפול מסמך
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 ml-2" />
              שיתוף
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 ml-2" />
              הגדרות
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 ml-2" />
              מחיקה
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default EditorToolbar;
