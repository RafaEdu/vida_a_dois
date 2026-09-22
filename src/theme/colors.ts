// ---------------------------------------------------------------------------
// Legacy palette (Material-like). Kept during the gradual migration so that
// existing screens continue to work. New code must use `colors` below.
// ---------------------------------------------------------------------------
export const C = {
  surface: "#f9f9ff",
  surfaceBright: "#f9f9ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f1f3ff",
  surfaceContainerHigh: "#e3e8f9",
  surfaceVariant: "#dde2f3",
  onSurface: "#161c27",
  onSurfaceVariant: "#434655",
  outline: "#747686",
  outlineVariant: "#c4c5d7",
  primary: "#1f4ed8",
  onPrimary: "#ffffff",
  primaryContainer: "#4169f2",
  onPrimaryContainer: "#fffbff",
  primaryFixed: "#dde1ff",
  primaryFixedDim: "#b7c4ff",
  onPrimaryFixed: "#001453",
  secondary: "#a53b29",
  onSecondary: "#ffffff",
  secondaryContainer: "#fe7d66",
  onSecondaryContainer: "#711609",
  tertiary: "#006763",
  tertiaryContainer: "#00827e",
  onTertiaryContainer: "#f3fffd",
  tertiaryFixed: "#84f5ee",
  onTertiaryFixed: "#00201e",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  avatarRed: "#ff5252",
  avatarTeal: "#39b5bf",
  progressGreen: "#4CAF50",
  inverseSurface: "#2a303d",
} as const;

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

  partnerB: "#0F4C45",
  partnerBSoft: "#D8F3EE",
  onPartnerB: "#FFFFFF",

  shared: "#4F46E5",
  sharedSoft: "#EEF0FF",
  onShared: "#FFFFFF",

  success: "#168568",
  successSoft: "#ECFDF5",
  onSuccess: "#FFFFFF",

  warning: "#A86416",
  warningSoft: "#FFF4E5",
  onWarning: "#FFFFFF",

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
