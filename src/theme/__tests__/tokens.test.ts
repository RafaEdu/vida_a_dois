import { describe, expect, it } from "@jest/globals";
import { colors, partnerColors } from "../colors";
import { radius } from "../radius";
import { shadows } from "../shadows";
import { screenPadding, spacing } from "../spacing";
import { fontFamilies, typography } from "../typography";

describe("canonical theme tokens", () => {
  it("exposes the canonical palette", () => {
    expect(colors.background).toBe("#FAF8FF");
    expect(colors.primary).toBe("#0F4C45");
    expect(colors.partnerA).toBe("#B34B32");
    expect(colors.partnerB).toBe("#0F4C45");
    expect(colors.shared).toBe("#4F46E5");
    expect(colors.danger).toBe("#C33D3D");
  });

  it("keeps both partners visually equivalent", () => {
    expect(partnerColors.a.base).toBe(colors.partnerA);
    expect(partnerColors.b.base).toBe(colors.partnerB);
  });

  it("uses the 4px spacing scale", () => {
    expect(spacing).toEqual({ xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 });
    expect(screenPadding.compact).toBe(20);
    expect(screenPadding.regular).toBe(24);
  });

  it("exposes the radius scale", () => {
    expect(radius).toEqual({ sm: 8, md: 12, lg: 16, xl: 24, full: 999 });
  });

  it("defines the three elevation levels plus none", () => {
    expect(Object.keys(shadows).sort()).toEqual([
      "card",
      "floating",
      "modal",
      "none",
    ]);
  });

  it("maps typography to the loaded font families", () => {
    expect(typography.display.fontFamily).toBe(fontFamilies.jakarta.bold);
    expect(typography.body.fontFamily).toBe(fontFamilies.inter.regular);
    expect(typography.bodySemibold.fontFamily).toBe(
      fontFamilies.inter.semibold,
    );
    expect(typography.label.fontSize).toBe(12);
  });
});
