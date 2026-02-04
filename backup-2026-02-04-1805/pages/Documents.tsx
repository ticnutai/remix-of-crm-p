import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DocumentManager } from '@/components/documents/DocumentManager';

export default function Documents() {
  return (
    <AppLayout>
      <DocumentManager />
    </AppLayout>
  );
}
