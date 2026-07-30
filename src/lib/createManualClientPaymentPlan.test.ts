import { describe, expect, it } from "vitest";
import { createManualClientPaymentPlan } from "@/lib/createManualClientPaymentPlan";

const baseInput = {
  clientId: "client-1",
  clientName: "לקוח בדיקה",
  planTitle: "תוכנית בדיקה",
};

describe("createManualClientPaymentPlan validation", () => {
  it.each([0.01, 9, 10.5])(
    "rejects a non-integer payment amount or an amount below ten: %s",
    async (amount) => {
      await expect(
        createManualClientPaymentPlan({
          ...baseInput,
          rows: [
            {
              name: "מקדמה",
              amount,
              percentage: 50,
              vatRate: 18,
            },
            {
              name: "יתרה",
              amount: 100,
              percentage: 50,
              vatRate: 18,
            },
          ],
          existingTasks: [],
        }),
      ).rejects.toThrow("סכום שלם של 10 ₪ ומעלה");
    },
  );

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

  it("rejects linking the same task to more than one payment", async () => {
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
            linkedTaskId: "task-1",
          },
        ],
        existingTasks: [
          {
            id: "task-1",
            title: "תשלום מקדמה",
          },
        ],
      }),
    ).rejects.toThrow("אותה משימה");
  });
});
