import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { CallHistory } from '@/components/calls/CallHistory';

export default function Calls() {
  return (
    <AppLayout>
      <CallHistory />
    </AppLayout>
  );
}
