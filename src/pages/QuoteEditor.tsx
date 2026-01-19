// עמוד עורך הצעות מחיר מתקדם

import React from 'react';
import { AppLayout } from '@/components/layout';
import { QuoteDocumentEditor } from '@/components/quotes/QuoteDocumentEditor';

export default function QuoteEditor() {
  return (
    <AppLayout title="עורך הצעות מחיר">
      <div className="h-[calc(100vh-120px)]">
        <QuoteDocumentEditor />
      </div>
    </AppLayout>
  );
}
