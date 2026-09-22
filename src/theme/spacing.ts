// Base unit: 4px. Main rhythm: 8px.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export type SpacingToken = keyof typeof spacing;

// Horizontal layout margins. Compact screens use 20px, larger screens 24px.
export const screenPadding = {
  compact: 20,
  regular: 24,
} as const;

// Comfortable content column for tablets/web.
export const maxContentWidth = 480;

// Minimum accessible touch target.
export const minTouchTarget = 44;
