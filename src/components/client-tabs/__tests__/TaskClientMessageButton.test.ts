import { describe, expect, it } from "vitest";
import {
  extractTaskMessagePhones,
  fillTaskMessageTemplate,
  normalizeTaskMessagePhone,
} from "@/lib/taskMessage";

describe("TaskClientMessageButton utilities", () => {
  it("normalizes an Israeli client phone for WhatsApp and SMS providers", () => {
    expect(normalizeTaskMessagePhone("054-123 4567")).toBe("972541234567");
    expect(normalizeTaskMessagePhone("+972 54 123 4567")).toBe("972541234567");
  });

  it("accepts local and international formats and keeps two numbers separate", () => {
    expect(extractTaskMessagePhones("0502857658")).toEqual(["972502857658"]);
    expect(extractTaskMessagePhones("+972 50 285 7658")).toEqual(["972502857658"]);
    expect(
      extractTaskMessagePhones("052-5376410 / 052-7649970"),
    ).toEqual(["972525376410", "972527649970"]);
  });

  it("rejects concatenated or incomplete phone values", () => {
    expect(extractTaskMessagePhones("9725253764100527649970")).toEqual([]);
    expect(extractTaskMessagePhones("12345")).toEqual([]);
  });

  it("fills every repeated task-message placeholder", () => {
    expect(
      fillTaskMessageTemplate(
        "שלום {client_name}, {office_name}: {task_title} / {stage_name} / {task_title}",
        {
          client_name: "ישראל",
          office_name: "המשרד",
          task_title: "צילום תעודה",
          stage_name: "התקשרות לקוח",
        },
      ),
    ).toBe("שלום ישראל, המשרד: צילום תעודה / התקשרות לקוח / צילום תעודה");
  });
});
