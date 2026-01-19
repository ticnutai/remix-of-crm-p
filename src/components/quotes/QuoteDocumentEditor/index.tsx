import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { DocumentPreview } from './DocumentPreview';
import { ItemsEditor } from './ItemsEditor';
import { useQuoteDocument } from './hooks/useQuoteDocument';
import { ViewMode } from './types';

export function QuoteDocumentEditor() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [scale, setScale] = useState(0.7);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    document,
    isDirty,
    updateDocument,
    addItem,
    updateItem,
    removeItem,
    moveItem,
    duplicateItem,
    resetDocument,
    loadTemplate,
  } = useQuoteDocument();

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      // TODO: Save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: 'נשמר בהצלחה', description: 'הצעת המחיר נשמרה' });
    } catch (error) {
      toast({ title: 'שגיאה', description: 'לא ניתן לשמור', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }, [toast]);

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

  return (
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
        onNew={resetDocument}
        onLoadTemplate={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
        onSaveAsTemplate={() => toast({ title: 'בקרוב', description: 'פונקציה זו תהיה זמינה בקרוב' })}
        isSaving={isSaving}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
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
  );
}

export default QuoteDocumentEditor;
