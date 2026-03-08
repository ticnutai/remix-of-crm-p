import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { DocumentPreview } from './DocumentPreview';
import { ItemsEditor } from './ItemsEditor';
import { PartiesEditor } from './PartiesEditor';
import { PaymentsEditor } from './PaymentsEditor';
import { SignaturesEditor } from './SignaturesEditor';
import { useDocumentEditor } from './hooks/useDocumentEditor';
import {
  DocumentData,
  DocumentType,
  ViewMode,
  EditorPanel,
  DocumentTemplate,
  defaultDocumentData,
} from './types';

interface DocumentEditorProps {
  documentType: DocumentType;
  initialData?: Partial<DocumentData>;
  templates?: DocumentTemplate[];
  onSave?: (data: DocumentData) => Promise<void>;
  onExportPDF?: (data: DocumentData) => Promise<void>;
  onExportImage?: (data: DocumentData) => Promise<void>;
  onSend?: (data: DocumentData) => void;
  onPrint?: (data: DocumentData) => void;
  className?: string;
}

export function DocumentEditor({
  documentType,
  initialData,
  templates = [],
  onSave,
  onExportPDF,
  onExportImage,
  onSend,
  onPrint,
  className,
}: DocumentEditorProps) {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [zoom, setZoom] = useState(100);
  const [activePanel, setActivePanel] = useState<EditorPanel>('items');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Use the document editor hook
  const editor = useDocumentEditor({
    initialData: {
      ...defaultDocumentData,
      type: documentType,
      ...initialData,
    },
    documentType,
  });

  // Undo/Redo stacks (simplified)
  const [undoStack, setUndoStack] = useState<DocumentData[]>([]);
  const [redoStack, setRedoStack] = useState<DocumentData[]>([]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [...prev, editor.document]);
    editor.loadDocument(previous);
  }, [undoStack, editor]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [...prev, editor.document]);
    editor.loadDocument(next);
  }, [redoStack, editor]);

  // Save state to undo stack before changes
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-19), editor.document]);
    setRedoStack([]);
  }, [editor.document]);

  // Handle save
  const handleSave = async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      await onSave(editor.document);
      // Note: isDirty is handled internally by the hook
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle new document
  const handleNewDocument = () => {
    if (editor.isDirty) {
      if (!confirm('יש שינויים שלא נשמרו. האם להמשיך?')) return;
    }
    editor.resetDocument();
    setUndoStack([]);
    setRedoStack([]);
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      pushUndo();
      editor.loadTemplate(template.data);
    }
  };

  // Handle export
  const handleExportPDF = async () => {
    if (onExportPDF) {
      await onExportPDF(editor.document);
    }
  };

  const handleExportImage = async () => {
    if (onExportImage) {
      await onExportImage(editor.document);
    }
  };

  // Handle send
  const handleSend = () => {
    if (onSend) {
      onSend(editor.document);
    }
  };

  // Handle print
  const handlePrint = () => {
    if (onPrint) {
      onPrint(editor.document);
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = editor.document.items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount =
      editor.document.discountType === 'percent'
        ? (subtotal * editor.document.discount) / 100
        : editor.document.discount;
    const afterDiscount = subtotal - discountAmount;
    const vatAmount = editor.document.settings.showVat
      ? (afterDiscount * editor.document.vatRate) / 100
      : 0;
    const total = afterDiscount + vatAmount;
    return { subtotal, discountAmount, afterDiscount, vatAmount, total };
  }, [editor.document.items, editor.document.discount, editor.document.discountType, editor.document.vatRate, editor.document.settings.showVat]);

  // Render content panel based on active panel
  const renderContentPanel = () => {
    switch (activePanel) {
      case 'items':
        return (
          <ItemsEditor
            items={editor.document.items}
            currency={editor.document.currency}
            onAddItem={(item) => {
              pushUndo();
              editor.addItem(item);
            }}
            onUpdateItem={(id, updates) => {
              pushUndo();
              editor.updateItem(id, updates);
            }}
            onRemoveItem={(id) => {
              pushUndo();
              editor.removeItem(id);
            }}
            onMoveItem={(from, to) => {
              pushUndo();
              editor.moveItem(from, to);
            }}
            onDuplicateItem={(id) => {
              pushUndo();
              editor.duplicateItem(id);
            }}
          />
        );
      case 'parties':
        return (
          <PartiesEditor
            parties={editor.document.parties}
            onAddParty={(party) => {
              pushUndo();
              editor.addParty(party);
            }}
            onUpdateParty={(id, updates) => {
              pushUndo();
              editor.updateParty(id, updates);
            }}
            onRemoveParty={(id) => {
              pushUndo();
              editor.removeParty(id);
            }}
          />
        );
      case 'payments':
        return (
          <PaymentsEditor
            paymentSteps={editor.document.paymentSteps}
            totalAmount={totals.total}
            currency={editor.document.currency}
            onAddPaymentStep={(step) => {
              pushUndo();
              editor.addPaymentStep(step);
            }}
            onUpdatePaymentStep={(id, updates) => {
              pushUndo();
              editor.updatePaymentStep(id, updates);
            }}
            onRemovePaymentStep={(id) => {
              pushUndo();
              editor.removePaymentStep(id);
            }}
          />
        );
      case 'signatures':
        return (
          <SignaturesEditor
            signatures={editor.document.signatures}
            parties={editor.document.parties}
            onAddSignature={(sig) => {
              pushUndo();
              editor.addSignature(sig);
            }}
            onUpdateSignature={(id, updates) => {
              pushUndo();
              editor.updateSignature(id, updates);
            }}
            onRemoveSignature={(id) => {
              pushUndo();
              editor.removeSignature(id);
            }}
          />
        );
      default:
        return null;
    }
  };

  // Calculate scale for preview
  const previewScale = zoom / 100;

  return (
    <div className={cn('flex flex-col h-full bg-muted/30', className)}>
      {/* Toolbar */}
      <EditorToolbar
        documentType={documentType}
        viewMode={viewMode}
        zoom={zoom}
        isDirty={editor.isDirty}
        isSaving={isSaving}
        canUndo={canUndo}
        canRedo={canRedo}
        templates={templates}
        onViewModeChange={setViewMode}
        onZoomChange={setZoom}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNewDocument={handleNewDocument}
        onTemplateSelect={handleTemplateSelect}
        onExportPDF={onExportPDF ? handleExportPDF : undefined}
        onExportImage={onExportImage ? handleExportImage : undefined}
        onSend={onSend ? handleSend : undefined}
        onPrint={onPrint ? handlePrint : undefined}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Sidebar */}
          {viewMode !== 'preview' && (
            <>
              <ResizablePanel
                defaultSize={sidebarCollapsed ? 4 : 22}
                minSize={4}
                maxSize={35}
                collapsible
                collapsedSize={4}
                onCollapse={() => setSidebarCollapsed(true)}
                onExpand={() => setSidebarCollapsed(false)}
              >
                <EditorSidebar
                  document={editor.document}
                  activePanel={activePanel}
                  collapsed={sidebarCollapsed}
                  onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                  onPanelChange={setActivePanel}
                  onUpdateDocument={(updates) => {
                    pushUndo();
                    editor.updateDocument(updates);
                  }}
                  onUpdateSettings={(settings) => {
                    pushUndo();
                    editor.updateSettings(settings);
                  }}
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Content Panel */}
          {viewMode !== 'preview' && (
            <>
              <ResizablePanel defaultSize={38} minSize={25}>
                <ScrollArea className="h-full">
                  <div className="p-4">{renderContentPanel()}</div>
                </ScrollArea>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Preview Panel */}
          <ResizablePanel
            defaultSize={viewMode === 'preview' ? 100 : 40}
            minSize={30}
          >
            <div className="h-full bg-muted/50 overflow-auto">
              <div
                className="p-4 min-h-full flex justify-center items-start"
              >
                <DocumentPreview
                  document={editor.document}
                  scale={previewScale}
                  fitToContainer={true}
                  editable={viewMode === 'edit'}
                  onFieldClick={(field) => {
                    // Focus on the relevant panel/field
                    if (field.startsWith('item')) {
                      setActivePanel('items');
                    } else if (field.startsWith('party')) {
                      setActivePanel('parties');
                    }
                  }}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
