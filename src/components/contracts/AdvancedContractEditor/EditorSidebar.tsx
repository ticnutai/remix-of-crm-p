// EditorSidebar - סרגל צד עם בלוקים להוספה
import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  FileSignature,
  Users,
  ListOrdered,
  DollarSign,
  Calendar,
  ScrollText,
  Pen,
  StickyNote,
  Code,
  Plus,
  GripVertical,
  ChevronRight,
  ChevronLeft,
  Layers,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ChevronUp,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { BlockType, ContractBlock, AVAILABLE_BLOCKS } from './types';
import { cn } from '@/lib/utils';

const BLOCK_ICONS: Record<BlockType, React.ComponentType<any>> = {
  header: FileSignature,
  parties: Users,
  section: ListOrdered,
  items: DollarSign,
  payments: DollarSign,
  timeline: Calendar,
  terms: ScrollText,
  signatures: Pen,
  notes: StickyNote,
  custom: Code,
};

interface EditorSidebarProps {
  blocks: ContractBlock[];
  selectedBlockId?: string;
  onSelectBlock?: (blockId: string) => void;
  onAddBlock?: (type: BlockType) => void;
  onRemoveBlock?: (blockId: string) => void;
  onDuplicateBlock?: (blockId: string) => void;
  onToggleVisibility?: (blockId: string) => void;
  onMoveBlock?: (blockId: string, direction: 'up' | 'down') => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function EditorSidebar({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onRemoveBlock,
  onDuplicateBlock,
  onToggleVisibility,
  onMoveBlock,
  collapsed = false,
  onToggleCollapse,
}: EditorSidebarProps) {
  if (collapsed) {
    return (
      <div className="w-12 border-l bg-muted/30 flex flex-col items-center py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 mb-2"
              onClick={onToggleCollapse}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">פתח סרגל צד</TooltipContent>
        </Tooltip>
        <Separator className="my-2" />
        <div className="flex-1 flex flex-col gap-1 items-center">
          {AVAILABLE_BLOCKS.slice(0, 5).map((blockConfig) => {
            const Icon = BLOCK_ICONS[blockConfig.type];
            return (
              <Tooltip key={blockConfig.type}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onAddBlock?.(blockConfig.type)}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{blockConfig.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-l bg-muted/30 flex flex-col">
      {/* כותרת */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">בלוקים</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleCollapse}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* רשימת בלוקים קיימים */}
        <div className="p-2">
          <div className="text-xs text-muted-foreground font-medium px-2 py-1 mb-1">
            במסמך ({blocks.length})
          </div>
          <div className="space-y-1">
            {blocks.map((block, index) => {
              const Icon = BLOCK_ICONS[block.type];
              const isSelected = selectedBlockId === block.id;
              
              return (
                <div
                  key={block.id}
                  className={cn(
                    'group flex items-center gap-1 rounded-md border bg-background p-1.5 transition-colors cursor-pointer',
                    isSelected && 'ring-2 ring-primary border-primary',
                    !block.visible && 'opacity-50'
                  )}
                  onClick={() => onSelectBlock?.(block.id)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab flex-shrink-0" />
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm truncate flex-1">{block.title}</span>
                  
                  {/* פעולות בלוק */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveBlock?.(block.id, 'up');
                          }}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>העבר למעלה</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveBlock?.(block.id, 'down');
                          }}
                          disabled={index === blocks.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>העבר למטה</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleVisibility?.(block.id);
                          }}
                        >
                          {block.visible ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{block.visible ? 'הסתר' : 'הצג'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateBlock?.(block.id);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>שכפל</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveBlock?.(block.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>מחק</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator className="my-2" />

        {/* הוספת בלוקים חדשים */}
        <div className="p-2">
          <div className="text-xs text-muted-foreground font-medium px-2 py-1 mb-1">
            הוסף בלוק
          </div>
          <div className="grid grid-cols-2 gap-1">
            {AVAILABLE_BLOCKS.map((blockConfig) => {
              const Icon = BLOCK_ICONS[blockConfig.type];
              return (
                <Tooltip key={blockConfig.type}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto flex flex-col items-center gap-1 p-2"
                      onClick={() => onAddBlock?.(blockConfig.type)}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[10px] leading-tight">{blockConfig.name}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <div className="text-center">
                      <div className="font-medium">{blockConfig.name}</div>
                      <div className="text-xs text-muted-foreground">{blockConfig.icon} {blockConfig.name}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {/* הגדרות */}
      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
          <Settings2 className="h-4 w-4" />
          הגדרות מסמך
        </Button>
      </div>
    </div>
  );
}

export default EditorSidebar;
