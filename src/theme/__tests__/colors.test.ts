import { describe, expect, it } from "@jest/globals";
import { C } from "../colors";

describe("theme colors", () => {
  it("exposes the primary color token", () => {
    expect(C.primary).toBe("#1f4ed8");
  });
});
