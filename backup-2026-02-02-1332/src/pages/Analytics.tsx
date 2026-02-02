// עמוד אנליטיקס
// דשבורד סטטיסטיקות וגרפים

import React from 'react';
import { AppLayout } from '@/components/layout';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function Analytics() {
  return (
    <AppLayout title="אנליטיקס">
      <AnalyticsDashboard />
    </AppLayout>
  );
}
