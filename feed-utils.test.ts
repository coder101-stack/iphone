import { describe, expect, it } from "vitest";
import { dedupeById } from "@/lib/feed-utils";

describe("dedupeById (Community tab duplicate fix)", () => {
  it("keeps first occurrence and order", () => {
    const list = [{ id: "a", n: 1 }, { id: "b", n: 2 }, { id: "a", n: 3 }, { id: "c", n: 4 }, { id: "b", n: 5 }];
    expect(dedupeById(list)).toEqual([{ id: "a", n: 1 }, { id: "b", n: 2 }, { id: "c", n: 4 }]);
  });
  it("handles empty lists and numeric ids", () => {
    expect(dedupeById([])).toEqual([]);
    expect(dedupeById([{ id: 1 }, { id: 1 }, { id: 2 }])).toEqual([{ id: 1 }, { id: 2 }]);
  });
});
