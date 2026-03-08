import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuotes, Quote } from '@/hooks/useQuotes';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { DocumentPreview } from './DocumentPreview';
import { ItemsEditor } from './ItemsEditor';
import { QuotesList } from './QuotesList';
import { useQuoteDocument } from './hooks/useQuoteDocument';
import { ViewMode } from './types';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';

export function QuoteDocumentEditor() {
  const { toast } = useToast();
  const { quotes, isLoading: quotesLoading, updateQuote, createQuote } = useQuotes();
  
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [scale, setScale] = useState(0.7);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [quotesListCollapsed, setQuotesListCollapsed] = useState(false);
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
    loadTemplate,
    loadQuote,
  } = useQuoteDocument();

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
      } else {
        toast({ 
          title: 'שים לב', 
          description: 'כדי לשמור הצעה חדשה, יש לבחור לקוח תחילה',
          variant: 'destructive'
        });
        setIsSaving(false);
        return;
      }
      
      toast({ title: 'נשמר בהצלחה', description: 'הצעת המחיר נשמרה' });
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לשמור', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [document, originalQuoteId, updateQuote, toast]);

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

  const handleSelectQuote = useCallback((quote: Quote) => {
    if (isDirty) {
      const confirm = window.confirm('יש שינויים שלא נשמרו. האם להמשיך?');
      if (!confirm) return;
    }
    loadQuote(quote);
    toast({ title: 'הצעת מחיר נטענה', description: quote.quote_number });
  }, [isDirty, loadQuote, toast]);

  const handleNewQuote = useCallback(() => {
    if (isDirty) {
      const confirm = window.confirm('יש שינויים שלא נשמרו. האם להמשיך?');
      if (!confirm) return;
    }
    resetDocument();
  }, [isDirty, resetDocument]);

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col bg-muted/30" dir="rtl">
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
          onNew={handleNewQuote}
          onLoadTemplate={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
          onSaveAsTemplate={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
          isSaving={isSaving}
        />

        {/* Main content with resizable panels */}
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Quotes List panel */}
          {!quotesListCollapsed && (
            <>
              <ResizablePanel defaultSize={18} minSize={12} maxSize={30}>
                <QuotesList
                  quotes={quotes}
                  isLoading={quotesLoading}
                  selectedQuoteId={originalQuoteId}
                  onSelect={handleSelectQuote}
                  onNew={handleNewQuote}
                  collapsed={quotesListCollapsed}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Sidebar panel */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
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
                defaultSize={viewMode === 'split' ? 30 : 67} 
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
              defaultSize={viewMode === 'split' ? 37 : 67} 
              minSize={25}
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

        {/* Toggle buttons when panels are collapsed */}
        <div className="fixed right-2 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
          {quotesListCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuotesListCollapsed(false)}
            >
              הצעות
            </Button>
          )}
          {sidebarCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed(false)}
            >
              הגדרות
            </Button>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

export default QuoteDocumentEditor;
