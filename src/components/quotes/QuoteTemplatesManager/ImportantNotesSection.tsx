// סקשן הערות חשובות
import React from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ImportantNotesSectionProps {
  notes: string[];
  onUpdate: (notes: string[]) => void;
  primaryColor?: string;
}

export function ImportantNotesSection({
  notes,
  onUpdate,
  primaryColor = '#d8ac27',
}: ImportantNotesSectionProps) {
  const addNote = () => {
    onUpdate([...notes, '']);
  };

  const updateNote = (index: number, value: string) => {
    const newNotes = [...notes];
    newNotes[index] = value;
    onUpdate(newNotes);
  };

  const removeNote = (index: number) => {
    onUpdate(notes.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-muted/30 rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <AlertCircle className="h-5 w-5" style={{ color: primaryColor }} />
        <span>הערות חשובות</span>
      </div>

      <div className="space-y-2">
        {notes.map((note, index) => (
          <div 
            key={index}
            className="flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50"
              onClick={() => removeNote(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Input
              value={note}
              onChange={(e) => updateNote(index, e.target.value)}
              placeholder="הקלד הערה..."
              className="flex-1"
            />
          </div>
        ))}

        {notes.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            אין הערות. הוסף הערה חשובה
          </div>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={addNote}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        הוסף הערה
      </Button>
    </div>
  );
}
