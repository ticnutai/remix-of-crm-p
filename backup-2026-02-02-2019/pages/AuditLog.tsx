// עמוד לוג ביקורת
// מעקב אחרי כל הפעולות במערכת

import React from 'react';
import { AppLayout } from '@/components/layout';
import { AuditLog } from '@/components/audit/AuditLog';

export default function AuditLogPage() {
  return (
    <AppLayout title="לוג שינויים">
      <AuditLog />
    </AppLayout>
  );
}
