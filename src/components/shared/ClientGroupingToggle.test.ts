import { describe, expect, it } from "vitest";
import {
  getItemClientName,
  groupItemsByClient,
  prepareClientGroupedItems,
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

  it("prepares client headers without changing items in the general view", () => {
    const items = [
      { id: "first", client_id: "client-1" },
      { id: "second", client_id: "client-1" },
      { id: "third", client_id: "client-2" },
    ];

    expect(prepareClientGroupedItems(items, clients, false)).toEqual(
      items.map((item) => ({
        item,
        clientName: "",
        groupCount: 0,
        groupStart: false,
      })),
    );

    const grouped = prepareClientGroupedItems(items, clients, true);
    expect(grouped.map(({ clientName, groupCount, groupStart }) => ({
      clientName,
      groupCount,
      groupStart,
    }))).toEqual([
      { clientName: "ישראל אסולין 91", groupCount: 1, groupStart: true },
      { clientName: "כורת קוזלובסקי", groupCount: 2, groupStart: true },
      { clientName: "כורת קוזלובסקי", groupCount: 2, groupStart: false },
    ]);
  });
});
