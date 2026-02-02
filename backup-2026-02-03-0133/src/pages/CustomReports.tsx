import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReportBuilder } from '@/components/reports/ReportBuilder';

export default function CustomReports() {
  return (
    <AppLayout>
      <ReportBuilder />
    </AppLayout>
  );
}
