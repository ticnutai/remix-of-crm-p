// AdvancedContractEditor - עורך חוזים מתקדם
import React, { useState, useCallback } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';
import { EditorSidebar } from './EditorSidebar';
import { DocumentPreview } from './DocumentPreview';
import { BlockEditor } from './BlockEditors';
import { useContractDocument } from './hooks/useContractDocument';
import { ViewMode, ColorScheme, DesignTemplate, BlockType, ContractDocument } from './types';

interface AdvancedContractEditorProps {
  initialDocument?: ContractDocument;
  documentId?: string;
  onSave?: (document: ContractDocument) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

export function AdvancedContractEditor({
  initialDocument,
  documentId,
  onSave,
  onClose,
  className,
}: AdvancedContractEditorProps) {
  const {
    document,
    isDirty,
    updateDocument,
    setColorScheme,
    setDesignTemplate,
    addBlock,
    updateBlock,
    updateBlockContent,
    removeBlock,
    moveBlock,
    duplicateBlock,
    toggleBlockVisibility,
    loadDocument,
    resetDocument,
  } = useContractDocument();

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // טעינת מסמך ראשוני
  React.useEffect(() => {
    if (initialDocument) {
      loadDocument(initialDocument, documentId);
    }
  }, [initialDocument, documentId, loadDocument]);

  // קבלת הבלוק הנבחר
  const selectedBlock = selectedBlockId
    ? document.blocks.find((b) => b.id === selectedBlockId)
    : undefined;

  // מצב כהה
  const toggleDarkMode = useCallback(() => {
    updateDocument({
      settings: {
        ...document.settings,
        darkMode: !document.settings?.darkMode,
      },
    });
  }, [document.settings, updateDocument]);

  // שמירה
  const handleSave = useCallback(async () => {
    if (onSave) {
      await onSave(document);
    }
  }, [document, onSave]);

  // ייצוא
  const handleExport = useCallback((format: 'pdf' | 'html' | 'word' | 'zip') => {
    // TODO: implement export
    console.log('Export to:', format);
  }, []);

  // הדפסה
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // בורר בלוק
  const handleSelectBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
    // אם במצב תצוגה בלבד, עבור למצב מפוצל
    if (viewMode === 'preview') {
      setViewMode('split');
    }
  }, [viewMode]);

  // הוספת בלוק
  const handleAddBlock = useCallback((type: BlockType) => {
    addBlock(type, selectedBlockId);
  }, [addBlock, selectedBlockId]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex flex-col h-full bg-background',
          isFullscreen && 'fixed inset-0 z-50',
          className
        )}
      >
        {/* Toolbar */}
        <EditorToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          colorScheme={document.colorScheme}
          onColorSchemeChange={setColorScheme}
          designTemplate={document.designTemplate}
          onDesignTemplateChange={setDesignTemplate}
          darkMode={document.settings?.darkMode || false}
          onDarkModeToggle={toggleDarkMode}
          onSave={handleSave}
          onExport={handleExport}
          onPrint={handlePrint}
          isDirty={isDirty}
          title={document.title}
          onTitleChange={(title) => updateDocument({ title })}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor / Preview */}
          <div className="flex-1 overflow-hidden">
            {viewMode === 'edit' && (
              <div className="h-full flex">
                {/* Block Editor */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {selectedBlock ? (
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {selectedBlock.title}
                                <Badge variant="outline" className="text-xs">
                                  {selectedBlock.type}
                                </Badge>
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedBlockId(undefined)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <BlockEditor
                              block={selectedBlock}
                              onBlockChange={(updates) =>
                                updateBlock(selectedBlock.id, updates)
                              }
                              onContentChange={(content) =>
                                updateBlockContent(selectedBlock.id, content)
                              }
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground">
                          <p className="text-lg mb-2">בחר בלוק לעריכה</p>
                          <p className="text-sm">לחץ על בלוק בסרגל הצד או בתצוגה המקדימה</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {viewMode === 'preview' && (
              <DocumentPreview
                document={document}
                selectedBlockId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
              />
            )}

            {viewMode === 'split' && (
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Editor Panel */}
                <ResizablePanel defaultSize={40} minSize={25}>
                  <ScrollArea className="h-full">
                    <div className="p-4">
                      {selectedBlock ? (
                        <Card>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {selectedBlock.title}
                                <Badge variant="outline" className="text-xs">
                                  {selectedBlock.type}
                                </Badge>
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedBlockId(undefined)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <BlockEditor
                              block={selectedBlock}
                              onBlockChange={(updates) =>
                                updateBlock(selectedBlock.id, updates)
                              }
                              onContentChange={(content) =>
                                updateBlockContent(selectedBlock.id, content)
                              }
                            />
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground border-2 border-dashed rounded-lg">
                          <p className="text-lg mb-2">בחר בלוק לעריכה</p>
                          <p className="text-sm">לחץ על בלוק בסרגל הצד או בתצוגה המקדימה</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Preview Panel */}
                <ResizablePanel defaultSize={60} minSize={30}>
                  <DocumentPreview
                    document={document}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={handleSelectBlock}
                    className="border-r"
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            )}
          </div>

          {/* Sidebar */}
          <EditorSidebar
            blocks={document.blocks}
            selectedBlockId={selectedBlockId}
            onSelectBlock={handleSelectBlock}
            onAddBlock={handleAddBlock}
            onRemoveBlock={removeBlock}
            onDuplicateBlock={duplicateBlock}
            onToggleVisibility={toggleBlockVisibility}
            onMoveBlock={moveBlock}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-1 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>{document.blocks.length} בלוקים</span>
            <span>•</span>
            <span>{document.blocks.filter((b) => b.visible).length} נראים</span>
            {isDirty && (
              <>
                <span>•</span>
                <span className="text-amber-500">שינויים לא נשמרו</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-3 w-3" />
              ) : (
                <Maximize2 className="h-3 w-3" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onClose}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AdvancedContractEditor;
