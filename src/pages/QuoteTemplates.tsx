// עמוד תבניות הצעות מחיר
// ניהול תבניות מוכנות להצעות

import React from 'react';
import { AppLayout } from '@/components/layout';
import { QuoteTemplatesManager } from '@/components/quotes/QuoteTemplatesManager';

export default function QuoteTemplates() {
  return (
    <AppLayout title="תבניות הצעות מחיר">
      <QuoteTemplatesManager />
    </AppLayout>
  );
}
