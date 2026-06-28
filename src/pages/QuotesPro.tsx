// עמוד הצעות מחיר PRO — מנהל המסמכים
import React from "react";
import { AppLayout } from "@/components/layout";
import { QuotesProManager } from "@/features/quotes-pro/manager/QuotesProManager";

export default function QuotesPro() {
  return (
    <AppLayout title="הצעות מחיר PRO">
      <QuotesProManager />
    </AppLayout>
  );
}
