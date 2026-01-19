import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';

export default function Dashboard() {
  return (
    <AppLayout>
      <ManagerDashboard />
    </AppLayout>
  );
}
