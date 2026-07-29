import { describe, expect, it } from "vitest";
import {
  getItemClientName,
  groupItemsByClient,
} from "./ClientGroupingToggle";

const clients = [
  { id: "client-1", name: "כורת קוזלובסקי" },
  { id: "client-2", name: "ישראל אסולין 91" },
];

describe("client grouping", () => {
  it("uses an embedded client name for tasks and meetings", () => {
    expect(
      getItemClientName({
        id: "task-1",
        client_id: "client-1",
        client: { name: "כורת קוזלובסקי" },
      }),
    ).toBe("כורת קוזלובסקי");
  });

  it("resolves client-linked reminders through entity_id", () => {
    expect(
      getItemClientName(
        {
          id: "reminder-1",
          entity_type: "client",
          entity_id: "client-2",
        },
        clients,
      ),
    ).toBe("ישראל אסולין 91");
  });

  it("keeps unassigned items in a dedicated final group", () => {
    const groups = groupItemsByClient(
      [
        { id: "unassigned" },
        { id: "assigned", client_id: "client-1" },
      ],
      clients,
    );

    expect(groups).toEqual([
      {
        clientName: "כורת קוזלובסקי",
        items: [{ id: "assigned", client_id: "client-1" }],
      },
      {
        clientName: "ללא לקוח",
        items: [{ id: "unassigned" }],
      },
    ]);
  });
});
