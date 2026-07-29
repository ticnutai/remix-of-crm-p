import { describe, expect, it } from "vitest";
import {
  fillTaskMessageTemplate,
  normalizeTaskMessagePhone,
} from "@/lib/taskMessage";

describe("TaskClientMessageButton utilities", () => {
  it("normalizes an Israeli client phone for WhatsApp and SMS providers", () => {
    expect(normalizeTaskMessagePhone("054-123 4567")).toBe("972541234567");
    expect(normalizeTaskMessagePhone("+972 54 123 4567")).toBe("972541234567");
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
