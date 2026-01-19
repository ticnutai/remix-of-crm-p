import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
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
import { PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      // Convert document items back to QuoteItem format
      const items = document.items.map(item => ({
        name: item.description,
        description: item.details || '',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      }));

      if (originalQuoteId) {
        // Update existing quote
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
        // For new quotes, we'd need client_id - show message
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
    // TODO: Implement file import
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

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Quotes List */}
          <QuotesList
            quotes={quotes}
            isLoading={quotesLoading}
            selectedQuoteId={originalQuoteId}
            onSelect={handleSelectQuote}
            onNew={handleNewQuote}
            collapsed={quotesListCollapsed}
          />

          {/* Toggle Quotes List */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-[70px] right-[320px] z-10 bg-background/80 shadow-sm"
            onClick={() => setQuotesListCollapsed(!quotesListCollapsed)}
            style={{ right: quotesListCollapsed ? '56px' : '320px' }}
          >
            {quotesListCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {/* Sidebar */}
          <EditorSidebar
            document={document}
            onUpdate={updateDocument}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Editor / Preview area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Edit panel */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={cn(
                'bg-card border-l overflow-hidden flex flex-col',
                viewMode === 'split' ? 'w-1/2' : 'flex-1'
              )}>
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
            )}

            {/* Preview panel */}
            {(viewMode === 'preview' || viewMode === 'split') && (
              <div className={cn(
                'bg-muted/50 overflow-hidden',
                viewMode === 'split' ? 'w-1/2' : 'flex-1'
              )}>
                <ScrollArea className="h-full">
                  <div className="p-8 flex justify-center">
                    <DocumentPreview
                      document={document}
                      scale={scale}
                      editable={viewMode !== 'preview'}
                    />
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default QuoteDocumentEditor;
