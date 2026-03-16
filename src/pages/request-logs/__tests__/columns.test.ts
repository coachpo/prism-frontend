import { describe, expect, it } from "vitest";
import { formatCost } from "../columns";

describe("formatCost", () => {
  it("preserves up to six fractional digits for small costs", () => {
    expect(formatCost(23_412, "$" )).toBe("$0.023412");
  });

  it("returns an em dash for zero and missing costs", () => {
    expect(formatCost(null, "$" )).toBe("—");
    expect(formatCost(0, "$" )).toBe("—");
  });
});
