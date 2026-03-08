import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { QuickInputSection } from '@/components/timer/QuickInputSection';

export function QuickInputSectionTestDialog() {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="fixed bottom-32 left-4 z-50 bg-indigo-600 hover:bg-indigo-500">
          🧪 Quick Options
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-lg bg-slate-900 text-white"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-indigo-300">בדיקת QuickInputSection</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm text-white/70">כותרת:</div>
            <QuickInputSection
              type="title"
              selectedValue={title}
              onSelect={(value) => setTitle((prev) => (prev ? `${prev}, ${value}` : value))}
            />
            <div className="p-2 rounded bg-white/5 border border-white/10 text-sm">
              <strong>נבחר:</strong> {title || '(כלום)'}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm text-white/70">הערות:</div>
            <QuickInputSection
              type="note"
              selectedValue={note}
              onSelect={(value) => setNote((prev) => (prev ? `${prev}, ${value}` : value))}
            />
            <div className="p-2 rounded bg-white/5 border border-white/10 text-sm">
              <strong>נבחר:</strong> {note || '(כלום)'}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setTitle('');
              setNote('');
            }}
          >
            נקה בחירה
          </Button>

          <div className="text-xs text-white/60">
            כדי להפעיל דיבאג: פתח Console והריץ: <code>localStorage.setItem('debug-quick-input','1')</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
