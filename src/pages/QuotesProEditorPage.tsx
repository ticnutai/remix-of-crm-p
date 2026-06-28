// עמוד עורך הצעת מחיר PRO
import React from "react";
import { AppLayout } from "@/components/layout";
import { QuotesProEditor } from "@/features/quotes-pro/editor/QuotesProEditor";

export default function QuotesProEditorPage() {
  return (
    <AppLayout title="עורך הצעת מחיר PRO">
      <QuotesProEditor />
    </AppLayout>
  );
}
