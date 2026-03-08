// Bulk Stage Assignment Dialog - tenarch CRM Pro
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { Layers, Plus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkStageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClientIds: string[];
  onUpdate: () => void;
}

export function BulkStageDialog({
  isOpen,
  onClose,
  selectedClientIds,
  onUpdate,
}: BulkStageDialogProps) {
  const [stages, setStages] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [newStageInput, setNewStageInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(true);

  // Fetch existing stages
  useEffect(() => {
    if (isOpen) {
      fetchStages();
    }
  }, [isOpen]);

  const fetchStages = async () => {
    setIsLoadingStages(true);
    try {
      const { data, error } = await supabase
        .from('client_stages')
        .select('stage_name');

      if (error) throw error;

      // Get unique stage names
      const uniqueStages = [...new Set(data?.map(s => s.stage_name) || [])];
      setStages(uniqueStages.filter(Boolean).sort());
    } catch (error) {
      console.error('Error fetching stages:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן לטעון את רשימת השלבים',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingStages(false);
    }
  };

  const handleAddNewStage = () => {
    const trimmedStage = newStageInput.trim();
    if (!trimmedStage || stages.includes(trimmedStage)) {
      setNewStageInput('');
      return;
    }
    setStages(prev => [...prev, trimmedStage].sort());
    setSelectedStage(trimmedStage);
    setNewStageInput('');
  };

  const handleApply = async () => {
    if (!selectedStage) {
      toast({
        title: 'בחר שלב',
        description: 'יש לבחור שלב להחלה',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const clientIds = selectedClientIds;

      // Update or insert stage for each client
      for (const clientId of clientIds) {
        const { error } = await supabase
          .from('client_stages')
          .upsert({
            client_id: clientId,
            stage_id: `stage_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            stage_name: selectedStage,
            stage_icon: 'Layers',
            sort_order: 0,
          }, {
            onConflict: 'client_id,stage_name'
          });

        if (error) throw error;
      }

      toast({
        title: 'השלב הוחל בהצלחה',
        description: `${clientIds.length} לקוחות הועברו לשלב "${selectedStage}"`,
      });

      onUpdate();
      handleClose();
    } catch (error) {
      console.error('Error applying stage:', error);
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להחיל את השלב על הלקוחות',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setSelectedStage('');
    setNewStageInput('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-violet-500" />
            הגדרת שלב ל-{selectedClientIds.length} לקוחות
          </DialogTitle>
          <DialogDescription>
            בחר שלב קיים או הוסף שלב חדש להחלה על הלקוחות שנבחרו
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Existing Stages */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-4 w-4" />
              שלבים קיימים
            </h3>
            {isLoadingStages ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stages.length > 0 ? (
              <ScrollArea className="h-64 border rounded-lg p-2">
                <div className="grid grid-cols-2 gap-2">
                  {stages.map((stage) => (
                    <button
                      key={stage}
                      onClick={() => setSelectedStage(stage)}
                      className={cn(
                        "relative p-3 border-2 rounded-lg text-right transition-all",
                        selectedStage === stage
                          ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                          : "border-border hover:border-violet-300 hover:bg-accent"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm">{stage}</span>
                        {selectedStage === stage && (
                          <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="border rounded-lg p-8 text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">לא נמצאו שלבים קיימים</p>
                <p className="text-xs mt-1">הוסף שלב חדש למטה</p>
              </div>
            )}
          </div>

          {/* Add New Stage */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Plus className="h-4 w-4" />
              הוסף שלב חדש
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="שם השלב החדש"
                value={newStageInput}
                onChange={(e) => setNewStageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewStage();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddNewStage}
                variant="outline"
                size="icon"
                disabled={!newStageInput.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Stage Preview */}
          {selectedStage && (
            <div className="border-t pt-4">
              <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">שלב נבחר:</p>
                <Badge variant="secondary" className="bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300">
                  <Layers className="h-3 w-3 mr-1" />
                  {selectedStage}
                </Badge>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            ביטול
          </Button>
          <Button
            onClick={handleApply}
            disabled={!selectedStage || isUpdating}
            className="bg-violet-500 hover:bg-violet-600"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                מחיל...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                החל שלב על {selectedClientIds.length} לקוחות
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
