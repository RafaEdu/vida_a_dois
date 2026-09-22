import { describe, expect, it } from "@jest/globals";
import { colors } from "../colors";

// WCAG 2.x relative luminance + contrast ratio.
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const value = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) =>
    channel(parseInt(value.slice(i, i + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA_NORMAL_TEXT = 4.5;

describe("theme contrast (WCAG AA)", () => {
  // Text token used on top of the matching soft/surface background.
  const textPairs: [keyof typeof colors, keyof typeof colors][] = [
    ["text", "background"],
    ["textSecondary", "background"],
    ["textSecondary", "surface"],
    ["textSecondary", "surfaceSubtle"],
    ["primary", "primarySoft"],
    ["onPartnerASoft", "partnerASoft"],
    ["partnerB", "partnerBSoft"],
    ["shared", "sharedSoft"],
    ["onSuccessSoft", "successSoft"],
    ["onWarningSoft", "warningSoft"],
    ["danger", "dangerSoft"],
  ];

  it.each(textPairs)("keeps %s readable on %s", (foreground, background) => {
    expect(
      contrast(colors[foreground], colors[background]),
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("keeps white text readable on the dark accent surfaces", () => {
    expect(contrast(colors.onPrimary, colors.primary)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
    expect(
      contrast(colors.onPrimary, colors.primaryDark),
    ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("does not use the terracotta accent as text on light surfaces", () => {
    // `partnerAAccent` is reserved for decorative graphics; it is documented as
    // not meeting text contrast on light backgrounds.
    expect(contrast(colors.partnerAAccent, colors.surface)).toBeLessThan(
      AA_NORMAL_TEXT,
    );
  });
});
