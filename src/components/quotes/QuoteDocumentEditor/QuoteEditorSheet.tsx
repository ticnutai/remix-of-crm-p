import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuotes, Quote } from '@/hooks/useQuotes';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { DocumentPreview } from './DocumentPreview';
import { ItemsEditor } from './ItemsEditor';
import { useQuoteDocument } from './hooks/useQuoteDocument';
import { ViewMode } from './types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { importFile } from '@/utils/fileImporter';

interface QuoteEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote?: Quote | null;
  onSaved?: () => void;
}

export function QuoteEditorSheet({ 
  open, 
  onOpenChange, 
  quote,
  onSaved
}: QuoteEditorSheetProps) {
  const { toast } = useToast();
  const { updateQuote, createQuote } = useQuotes();
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [scale, setScale] = useState(0.85);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    document,
    originalQuoteId,
    isDirty,
    updateDocument,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    duplicateItem,
    resetDocument,
    loadQuote,
    loadImportedContent,
  } = useQuoteDocument();

  // Load quote when it changes
  React.useEffect(() => {
    if (quote && open) {
      loadQuote(quote);
    } else if (!quote && open) {
      resetDocument();
    }
  }, [quote, open, loadQuote, resetDocument]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const items = document.items.map(item => ({
        name: item.description,
        description: item.details || '',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      }));

      if (originalQuoteId) {
        await updateQuote.mutateAsync({
          id: originalQuoteId,
          title: document.title,
          items,
          vat_rate: document.vatRate,
          valid_until: document.validUntil,
          notes: document.notes,
          terms_and_conditions: document.terms,
        });
        toast({ title: 'נשמר בהצלחה', description: 'הצעת המחיר עודכנה' });
        onSaved?.();
      } else {
        toast({ 
          title: 'שים לב', 
          description: 'כדי לשמור הצעה חדשה, יש לבחור לקוח תחילה',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לשמור', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [document, originalQuoteId, updateQuote, toast, onSaved]);

  const handleExportPdf = useCallback(() => {
    toast({ title: 'מייצא PDF...', description: 'המסמך מיוצא' });
    window.print();
  }, [toast]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleImport = useCallback(async (file: File) => {
    toast({ title: 'מייבא קובץ...', description: file.name });
    
    try {
      const imported = await importFile(file);
      loadImportedContent(imported);
      
      toast({ 
        title: 'קובץ יובא בהצלחה', 
        description: `נמצאו ${imported.items.length} פריטים` 
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({ 
        title: 'שגיאה בייבוא', 
        description: error instanceof Error ? error.message : 'לא ניתן לקרוא את הקובץ',
        variant: 'destructive'
      });
    }
  }, [toast, loadImportedContent]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      const confirm = window.confirm('יש שינויים שלא נשמרו. האם לסגור?');
      if (!confirm) return;
    }
    onOpenChange(false);
  }, [isDirty, onOpenChange]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="right" 
        hideClose
        className="flex flex-col gap-0 overflow-hidden border-0"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          maxWidth: 'none',
          padding: 0,
          zIndex: 300,
        }}
        dir="rtl"
      >
        <TooltipProvider>
          <div className="h-full w-full flex flex-col bg-muted/30 overflow-hidden">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-3 border-b bg-background shrink-0 z-10">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg">
                  עורך הצעת מחיר מתקדם
                </h2>
                {originalQuoteId && (
                  <span className="text-sm text-muted-foreground">
                    ({document.quoteNumber})
                  </span>
                )}
                {isDirty && (
                  <span className="text-xs text-destructive">• שינויים לא נשמרו</span>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Toolbar */}
            <div className="shrink-0 z-10">
              <EditorToolbar
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                scale={scale}
                onScaleChange={setScale}
                isDirty={isDirty}
                onSave={handleSave}
                onExportPdf={handleExportPdf}
                onExportImage={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
                onPrint={handlePrint}
                onImport={handleImport}
                onNew={() => resetDocument()}
                onLoadTemplate={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
                onSaveAsTemplate={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
                isSaving={isSaving}
              />
            </div>

            {/* Main content with resizable panels */}
            <div className="flex-1 min-h-0 overflow-hidden w-full">
              <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                {/* Sidebar panel */}
                {!sidebarCollapsed && (
                  <>
                    <ResizablePanel 
                      id="sidebar-panel"
                      order={1}
                      defaultSize={20} 
                      minSize={15} 
                      maxSize={30} 
                      className="h-full"
                    >
                      <div className="h-full overflow-hidden relative z-10">
                        <EditorSidebar
                          document={document}
                          onUpdate={updateDocument}
                          collapsed={sidebarCollapsed}
                          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                        />
                      </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                  </>
                )}

                {/* Edit panel */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <>
                    <ResizablePanel 
                      id="edit-panel"
                      order={2}
                      defaultSize={sidebarCollapsed ? (viewMode === 'split' ? 50 : 100) : (viewMode === 'split' ? 40 : 80)} 
                      minSize={25}
                      className="h-full"
                    >
                      <div className="h-full bg-card border-l flex flex-col overflow-hidden">
                        <ScrollArea className="flex-1 h-full">
                          <div className="p-4">
                            <ItemsEditor
                              items={document.items}
                              onAdd={addItem}
                              onUpdate={updateItem}
                              onRemove={removeItem}
                              onMove={moveItem}
                              onDuplicate={duplicateItem}
                              showNumbers={document.showItemNumbers}
                            />
                          </div>
                        </ScrollArea>
                      </div>
                    </ResizablePanel>
                    {viewMode === 'split' && <ResizableHandle withHandle />}
                  </>
                )}

                {/* Preview panel */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <ResizablePanel 
                    id="preview-panel"
                    order={3}
                    defaultSize={sidebarCollapsed ? (viewMode === 'split' ? 50 : 100) : (viewMode === 'split' ? 40 : 80)} 
                    minSize={25}
                    className="h-full"
                  >
                    <div className="h-full bg-muted/50 overflow-hidden">
                      <ScrollArea className="h-full">
                        <div className="p-8 flex justify-center min-h-full">
                          <DocumentPreview
                            document={document}
                            scale={scale}
                            editable={viewMode !== 'preview'}
                          />
                        </div>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                )}
              </ResizablePanelGroup>
            </div>

            {/* Toggle sidebar button when collapsed */}
            {sidebarCollapsed && (
              <Button
                variant="outline"
                size="sm"
                className="fixed right-2 top-1/2 -translate-y-1/2 z-50"
                onClick={() => setSidebarCollapsed(false)}
              >
                הגדרות
              </Button>
            )}
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}

export default QuoteEditorSheet;
