import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';

export default function TasksKanban() {
  return (
    <AppLayout>
      <KanbanBoard />
    </AppLayout>
  );
}
