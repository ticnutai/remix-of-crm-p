import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WorkflowManager } from '@/components/workflows/WorkflowManager';

export default function Workflows() {
  return (
    <AppLayout>
      <WorkflowManager />
    </AppLayout>
  );
}
