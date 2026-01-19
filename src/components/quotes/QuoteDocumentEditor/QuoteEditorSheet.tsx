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

  const handleImport = useCallback((file: File) => {
    toast({ title: 'מייבא קובץ', description: file.name });
  }, [toast]);

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
        className="w-screen max-w-none p-0 flex flex-col"
        dir="rtl"
      >
        <TooltipProvider>
          <div className="h-full flex flex-col bg-muted/30">
            {/* Header with close button */}
            <div className="flex items-center justify-between p-2 border-b bg-background">
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

            {/* Main content with resizable panels */}
            <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0">
              {/* Sidebar panel */}
              {!sidebarCollapsed && (
                <>
                  <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
                    <EditorSidebar
                      document={document}
                      onUpdate={updateDocument}
                      collapsed={sidebarCollapsed}
                      onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                  </ResizablePanel>
                  <ResizableHandle withHandle />
                </>
              )}

              {/* Edit panel */}
              {(viewMode === 'edit' || viewMode === 'split') && (
                <>
                  <ResizablePanel 
                    defaultSize={viewMode === 'split' ? 35 : 82} 
                    minSize={20}
                  >
                    <div className="h-full bg-card border-l overflow-hidden flex flex-col">
                      <ScrollArea className="flex-1 p-4">
                        <ItemsEditor
                          items={document.items}
                          onAdd={addItem}
                          onUpdate={updateItem}
                          onRemove={removeItem}
                          onMove={moveItem}
                          onDuplicate={duplicateItem}
                          showNumbers={document.showItemNumbers}
                        />
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                  {viewMode === 'split' && <ResizableHandle withHandle />}
                </>
              )}

              {/* Preview panel */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <ResizablePanel 
                  defaultSize={viewMode === 'split' ? 47 : 82} 
                  minSize={30}
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
