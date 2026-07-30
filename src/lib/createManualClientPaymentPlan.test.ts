import { describe, expect, it } from "vitest";
import { createManualClientPaymentPlan } from "@/lib/createManualClientPaymentPlan";

const baseInput = {
  clientId: "client-1",
  clientName: "לקוח בדיקה",
  planTitle: "תוכנית בדיקה",
};

describe("createManualClientPaymentPlan validation", () => {
  it("rejects percentages that are not multiples of five", async () => {
    await expect(
      createManualClientPaymentPlan({
        ...baseInput,
        rows: [
          {
            name: "מקדמה",
            amount: 330,
            percentage: 33,
            vatRate: 18,
          },
          {
            name: "יתרה",
            amount: 670,
            percentage: 67,
            vatRate: 18,
          },
        ],
        existingTasks: [],
      }),
    ).rejects.toThrow("בכפולות של 5");
  });

  it("rejects linking a payment to a task without the word תשלום", async () => {
    await expect(
      createManualClientPaymentPlan({
        ...baseInput,
        rows: [
          {
            name: "מקדמה",
            amount: 500,
            percentage: 50,
            vatRate: 18,
            linkedTaskId: "task-1",
          },
          {
            name: "יתרה",
            amount: 500,
            percentage: 50,
            vatRate: 18,
          },
        ],
        existingTasks: [
          {
            id: "task-1",
            title: "קבלת מסמכים מהלקוח",
          },
        ],
      }),
    ).rejects.toThrow("המילה „תשלום”");
  });
});
