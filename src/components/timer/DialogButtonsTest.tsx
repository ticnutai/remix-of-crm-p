import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';

export function DialogButtonsTest() {
  const [titles, setTitles] = useState<string[]>(['תכנון', 'עיצוב', 'פגישה']);
  const [newTitle, setNewTitle] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [clickLog, setClickLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    console.log(msg);
    setClickLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleAddTitle = () => {
    addLog('Add button clicked!');
    if (newTitle.trim()) {
      setTitles([...titles, newTitle.trim()]);
      setNewTitle('');
      addLog(`Title added: ${newTitle}`);
    } else {
      addLog('Empty title - not added');
    }
  };

  const handleSelectTitle = (title: string) => {
    addLog(`Select button clicked: ${title}`);
    setSelectedTitle(title);
  };

  const handleRemoveTitle = (index: number) => {
    addLog(`Remove button clicked: ${titles[index]}`);
    setTitles(titles.filter((_, i) => i !== index));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="fixed bottom-20 left-4 z-50 bg-red-500">
          🧪 בדיקת כפתורים
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-md bg-slate-800 text-white border-yellow-500"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-yellow-400">בדיקת כפתורים בדיאלוג</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Title Display */}
          <div className="p-2 bg-green-900 rounded">
            <strong>נבחר:</strong> {selectedTitle || '(כלום)'}
          </div>

          {/* Titles List */}
          <div className="space-y-2">
            <h4 className="font-bold">כותרות:</h4>
            <div className="flex flex-wrap gap-2">
              {titles.map((title, index) => (
                <div key={`title-${title}-${index}`} className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant={selectedTitle === title ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelectTitle(title);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    className={selectedTitle === title ? "bg-yellow-500 text-black" : ""}
                  >
                    {title}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveTitle(index);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Title */}
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="כותרת חדשה..."
              className="bg-white/10 border-white/30 text-white"
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTitle();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
            <Button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddTitle();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="bg-yellow-500 hover:bg-yellow-400 text-black"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Click Log */}
          <div className="mt-4 p-2 bg-black/50 rounded max-h-32 overflow-y-auto text-xs">
            <strong className="text-yellow-400">לוג לחיצות:</strong>
            {clickLog.length === 0 ? (
              <p className="text-gray-400">עדיין אין לחיצות...</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {clickLog.map((log, i) => (
                  <li key={`log-${Date.now()}-${i}`} className="text-green-400">{log}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Clear Log */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setClickLog([]);
              addLog('Log cleared');
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full"
          >
            נקה לוג
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
