import { describe, expect, it } from "vitest";
import {
  moveRecentClientBefore,
  sortByPersonalRecentOrder,
} from "./recentClientOrder";

describe("recent client personal order", () => {
  const clients = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const activity = {
    a: "2026-07-01T00:00:00.000Z",
    b: "2026-07-03T00:00:00.000Z",
    c: "2026-07-02T00:00:00.000Z",
  };

  it("places personally ordered clients first and keeps new clients activity-sorted", () => {
    expect(
      sortByPersonalRecentOrder(clients, ["a"], activity).map(
        (client) => client.id,
      ),
    ).toEqual(["a", "b", "c"]);
  });

  it("moves a visible client and preserves saved clients outside the current filter", () => {
    expect(
      moveRecentClientBefore(
        ["hidden", "a", "b", "c"],
        ["a", "b", "c"],
        "c",
        "a",
      ),
    ).toEqual(["c", "a", "b", "hidden"]);
  });

  it("does not change the order for an invalid drop", () => {
    const order = ["a", "b"];
    expect(moveRecentClientBefore(order, ["a", "b"], "missing", "a")).toBe(
      order,
    );
  });
});
