// ---------------------------------------------------------------------------
// Canonical palette — Vida a Dois v1.
// Semantic names are the single source of truth for the redesigned UI.
// Do not introduce hardcoded colors in screens; add a token here instead.
// ---------------------------------------------------------------------------
export const colors = {
  background: "#FAF8FF",

  surface: "#FFFFFF",
  surfaceSubtle: "#F2F3FF",
  surfaceMuted: "#EAEDFF",

  text: "#131B2E",
  textSecondary: "#5F687A",
  border: "#E2E5EF",

  // Text/icon color used on top of `primary`, `primaryDark` and other
  // saturated surfaces.
  onPrimary: "#FFFFFF",
  // Translucent overlay for sub-cards placed on top of dark/inverse surfaces
  // (e.g. the Home balance card). Keeps content readable without a new hue.
  onPrimaryOverlay: "rgba(255, 255, 255, 0.12)",

  primary: "#0F4C45",
  primaryDark: "#00342F",
  primarySoft: "#D8F3EE",

  partnerA: "#B34B32",
  partnerAAccent: "#E07A5F",
  partnerASoft: "#FFE3DA",
  onPartnerA: "#FFFFFF",
  // Text/icon color tuned for AA contrast (>=4.5:1) on `partnerASoft`. The base
  // `partnerA` accent is reserved for fills, bars and decorative graphics.
  onPartnerASoft: "#9E3F28",

  partnerB: "#0F4C45",
  partnerBSoft: "#D8F3EE",
  onPartnerB: "#FFFFFF",

  shared: "#4F46E5",
  sharedSoft: "#EEF0FF",
  onShared: "#FFFFFF",

  success: "#168568",
  successSoft: "#ECFDF5",
  onSuccess: "#FFFFFF",
  // See `onPartnerASoft`: darker text variants for the matching soft surfaces.
  onSuccessSoft: "#0F6B54",

  warning: "#A86416",
  warningSoft: "#FFF4E5",
  onWarning: "#FFFFFF",
  onWarningSoft: "#8A4F0F",

  danger: "#C33D3D",
  dangerSoft: "#FEF2F2",
  onDanger: "#FFFFFF",

  // Scrim behind modals/bottom sheets.
  scrim: "rgba(19, 27, 46, 0.45)",
} as const;

export type ColorToken = keyof typeof colors;

// Partner roles map to stable colors so the two people always read the same
// way across the app. `a`/`b` are assigned by the couple context, not here.
export const partnerColors = {
  a: {
    base: colors.partnerA,
    soft: colors.partnerASoft,
    on: colors.onPartnerA,
  },
  b: {
    base: colors.partnerB,
    soft: colors.partnerBSoft,
    on: colors.onPartnerB,
  },
} as const;

export type PartnerRole = keyof typeof partnerColors;
