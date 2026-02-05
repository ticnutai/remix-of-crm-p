// עורך חוזים מתקדם - גרסה 2.0 מחודשת לחלוטין
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Save,
  Download,
  Printer,
  Undo,
  Redo,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Settings,
  Palette,
  Layout,
  FileText,
  Plus,
  Trash2,
  Copy,
  GripVertical,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Layers,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Table,
  Image,
  Link2,
  Code,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { ContractDocument, ContractBlock, BlockType, ColorScheme, DesignTemplate } from './types';
import { useContractDocument } from './hooks/useContractDocument';
import { BlockEditor } from './NewBlockEditors';
import { BlockPreview } from './BlockPreview';

interface NewAdvancedEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDocument?: ContractDocument;
  onSave?: (document: ContractDocument) => Promise<void>;
}

export function NewAdvancedEditor({
  open,
  onOpenChange,
  initialDocument,
  onSave,
}: NewAdvancedEditorProps) {
  const {
    document,
    isDirty,
    history,
    canUndo,
    canRedo,
    updateDocument,
    setColorScheme,
    setDesignTemplate,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    toggleBlockVisibility,
    undo,
    redo,
    loadDocument,
  } = useContractDocument();

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);

  // טעינת מסמך ראשוני
  useEffect(() => {
    if (initialDocument && open) {
      loadDocument(initialDocument);
    }
  }, [initialDocument, open, loadDocument]);

  // Auto-save
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const timer = setTimeout(async () => {
      if (onSave) {
        await onSave(document);
        toast({ title: 'נשמר אוטומטית', duration: 2000 });
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [document, isDirty, autoSave, onSave]);

  // שמירה ידנית
  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave(document);
      toast({ title: 'נשמר בהצלחה!' });
    }
  }, [document, onSave]);

  // ייצוא
  const handleExport = useCallback((format: 'pdf' | 'html' | 'word' | 'docx') => {
    // TODO: implement export
    toast({
      title: `ייצוא ל-${format.toUpperCase()}`,
      description: 'הפונקציה בפיתוח',
    });
  }, []);

  // הדפסה
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const selectedBlock = useMemo(
    () => document.blocks.find((b) => b.id === selectedBlockId),
    [document.blocks, selectedBlockId]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] h-[98vh] p-0 gap-0">
        <TooltipProvider>
          <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header - Toolbar מודרני */}
            <div className="flex-shrink-0 border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center justify-between px-4 py-3">
                {/* Right Side - Actions */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>סגור</TooltipContent>
                  </Tooltip>

                  <Separator orientation="vertical" className="h-6" />

                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={undo}
                          disabled={!canUndo}
                        >
                          <Undo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>ביטול (Ctrl+Z)</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={redo}
                          disabled={!canRedo}
                        >
                          <Redo className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>חזרה (Ctrl+Y)</TooltipContent>
                    </Tooltip>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* View Mode */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'edit' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('edit')}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>עריכה</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'split' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('split')}
                        >
                          <Layout className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>מפוצל</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('preview')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>תצוגה מקדימה</TooltipContent>
                    </Tooltip>
                  </div>

                  <Separator orientation="vertical" className="h-6" />

                  {/* Color Schemes */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Palette className="h-4 w-4 ml-2" />
                        צבעים
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>ערכת צבעים</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setColorScheme('gold')}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-yellow-500" />
                          זהב
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setColorScheme('blue')}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500" />
                          כחול
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setColorScheme('green')}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500" />
                          ירוק
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setColorScheme('purple')}>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500" />
                          סגול
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Design Templates */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Sparkles className="h-4 w-4 ml-2" />
                        עיצוב
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>תבנית עיצוב</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDesignTemplate('classic')}>
                        קלאסי
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDesignTemplate('modern')}>
                        מודרני
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setDesignTemplate('minimal')}>
                        מינימלי
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Center - Document Title */}
                <div className="flex-1 flex items-center justify-center px-4">
                  <div className="text-center">
                    <Input
                      value={document.title}
                      onChange={(e) => updateDocument({ title: e.target.value })}
                      className="text-lg font-semibold text-center border-0 bg-transparent focus-visible:ring-0"
                      placeholder="שם החוזה"
                    />
                    {isDirty && (
                      <Badge variant="secondary" className="text-xs">
                        שינויים לא נשמרו
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Left Side - Save & Export */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 ml-2" />
                        ייצוא
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>ייצוא כ...</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExport('pdf')}>
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('html')}>
                        HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('word')}>
                        Word
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport('docx')}>
                        DOCX
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={handlePrint}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>הדפסה</TooltipContent>
                  </Tooltip>

                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!isDirty}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    שמור
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar - Blocks */}
              {sidebarOpen && (viewMode === 'edit' || viewMode === 'split') && (
                <div className="w-72 border-l bg-white dark:bg-slate-900 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      בלוקים
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                      {/* Add Block Button */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full" size="sm">
                            <Plus className="h-4 w-4 ml-2" />
                            הוסף בלוק
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="start">
                          <DropdownMenuLabel>סוג בלוק</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => addBlock('header')}>
                            כותרת
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('parties')}>
                            צדדים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('section')}>
                            סעיף
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('items')}>
                            פריטים/מחירים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('payments')}>
                            תשלומים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('timeline')}>
                            לוח זמנים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('terms')}>
                            תנאים
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('signatures')}>
                            חתימות
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('notes')}>
                            הערות
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => addBlock('custom')}>
                            מותאם אישית
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Separator />

                      {/* Blocks List */}
                      {document.blocks.map((block, index) => (
                        <div
                          key={block.id}
                          className={cn(
                            'group relative rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md',
                            selectedBlockId === block.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          )}
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {block.title}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {block.type}
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBlockVisibility(block.id);
                                }}
                              >
                                {block.visible ? (
                                  <Eye className="h-3 w-3" />
                                ) : (
                                  <EyeOff className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  duplicateBlock(block.id);
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeBlock(block.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* Toggle Sidebar Button */}
              {!sidebarOpen && (viewMode === 'edit' || viewMode === 'split') && (
                <div className="flex items-start justify-center p-2 bg-white dark:bg-slate-900 border-l">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>
                </div>
              )}

              {/* Canvas - Editor or Preview */}
              <div className="flex-1 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <ScrollArea className="h-full">
                  <div className="p-8">
                    {viewMode === 'preview' ? (
                      /* Preview Mode */
                      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-12">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          <h1 className="text-3xl font-bold mb-8 text-center">{document.title}</h1>
                          {document.blocks
                            .filter((b) => b.visible)
                            .map((block) => (
                              <BlockPreview
                                key={block.id}
                                block={block}
                                colorScheme={document.colorScheme}
                                isSelected={false}
                              />
                            ))}
                        </div>
                      </div>
                    ) : (
                      /* Edit/Split Mode */
                      <div className={cn('grid gap-8', viewMode === 'split' && 'grid-cols-2')}>
                        {/* Editor */}
                        <div className="space-y-4">
                          {selectedBlock ? (
                            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{selectedBlock.title}</h3>
                                <Badge>{selectedBlock.type}</Badge>
                              </div>
                              <BlockEditor
                                block={selectedBlock}
                                onChange={(content) => updateBlock(selectedBlock.id, { content })}
                              />
                            </div>
                          ) : (
                            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-12 text-center">
                              <Layers className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                              <h3 className="text-lg font-semibold mb-2">בחר בלוק לעריכה</h3>
                              <p className="text-sm text-muted-foreground">
                                בחר בלוק מהסיידבר או הוסף בלוק חדש
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Preview (in split mode) */}
                        {viewMode === 'split' && (
                          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl p-8 overflow-auto">
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                              <h1 className="text-2xl font-bold mb-6 text-center">{document.title}</h1>
                              {document.blocks
                                .filter((b) => b.visible)
                                .map((block) => (
                                  <div
                                    key={block.id}
                                    onClick={() => setSelectedBlockId(block.id)}
                                    className="cursor-pointer"
                                  >
                                    <BlockPreview
                                      block={block}
                                      colorScheme={document.colorScheme}
                                      isSelected={selectedBlockId === block.id}
                                    />
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Footer - Status Bar */}
            <div className="flex-shrink-0 border-t bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-4 py-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>{document.blocks.length} בלוקים</span>
                  <span>{document.blocks.filter((b) => b.visible).length} גלויים</span>
                  <span>ערכת צבעים: {document.colorScheme}</span>
                  <span>עיצוב: {document.designTemplate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>{autoSave ? '✓ שמירה אוטומטית' : 'שמירה ידנית'}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{zoom}%</span>
                </div>
              </div>
            </div>
          </div>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

export default NewAdvancedEditor;
