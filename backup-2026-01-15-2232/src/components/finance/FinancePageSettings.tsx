import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FinanceSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  visible: boolean;
  order: number;
}

interface FinancePageSettingsProps {
  sections: FinanceSection[];
  onSectionsChange: (sections: FinanceSection[]) => void;
}

const STORAGE_KEY = 'finance-page-sections';

export function FinancePageSettings({ sections, onSectionsChange }: FinancePageSettingsProps) {
  const [open, setOpen] = useState(false);
  const [localSections, setLocalSections] = useState<FinanceSection[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedSections = JSON.parse(saved);
        // Merge with current sections to handle new sections
        const merged = sections.map(section => {
          const savedSection = savedSections.find((s: FinanceSection) => s.id === section.id);
          return savedSection ? { ...section, visible: savedSection.visible, order: savedSection.order } : section;
        }).sort((a, b) => a.order - b.order);
        setLocalSections(merged);
        // Apply saved settings immediately
        onSectionsChange(merged);
      } catch (e) {
        setLocalSections(sections);
      }
    } else {
      setLocalSections(sections);
    }
    setIsInitialized(true);
  }, []);

  // Update local sections when dialog opens
  useEffect(() => {
    if (open && isInitialized) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const savedSections = JSON.parse(saved);
          const merged = sections.map(section => {
            const savedSection = savedSections.find((s: FinanceSection) => s.id === section.id);
            return savedSection ? { ...section, visible: savedSection.visible, order: savedSection.order } : section;
          }).sort((a, b) => a.order - b.order);
          setLocalSections(merged);
        } catch (e) {
          setLocalSections(sections);
        }
      }
    }
  }, [open, sections, isInitialized]);

  const handleToggleVisibility = (id: string) => {
    const updated = localSections.map(s => 
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    setLocalSections(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...localSections];
    const [removed] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, removed);
    
    // Update order values
    const reordered = updated.map((s, i) => ({ ...s, order: i }));
    setLocalSections(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = () => {
    // Save to localStorage with section data (without icon since it can't be serialized)
    const sectionsToSave = localSections.map(({ id, visible, order }) => ({ id, visible, order }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sectionsToSave));
    onSectionsChange(localSections);
    setOpen(false);
  };

  const handleReset = () => {
    const reset = sections.map((s, i) => ({ ...s, visible: true, order: i }));
    setLocalSections(reset);
    localStorage.removeItem(STORAGE_KEY);
    onSectionsChange(reset);
    setOpen(false);
  };

  const visibleCount = localSections.filter(s => s.visible).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">סידור העמוד</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            סידור עמוד הכספים
          </DialogTitle>
          <DialogDescription>
            בחר אילו סקציות להציג וגרור כדי לשנות סדר
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {localSections.map((section, index) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  "bg-card hover:bg-accent/50 cursor-move",
                  draggedIndex === index && "opacity-50 border-dashed",
                  dragOverIndex === index && "border-primary border-2",
                  !section.visible && "opacity-60"
                )}
              >
                <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {section.icon}
                  </div>
                  <span className="font-medium">{section.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Label htmlFor={`visible-${section.id}`} className="sr-only">
                    הצג {section.name}
                  </Label>
                  <Switch
                    id={`visible-${section.id}`}
                    checked={section.visible}
                    onCheckedChange={() => handleToggleVisibility(section.id)}
                  />
                  {section.visible ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {visibleCount} מתוך {localSections.length} סקציות מוצגות
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            איפוס
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave}>
            שמור שינויים
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
