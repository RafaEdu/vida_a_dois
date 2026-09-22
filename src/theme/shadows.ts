import { Platform, type ViewStyle } from "react-native";

// ---------------------------------------------------------------------------
// Canonical elevation tokens.
//   0 canvas | 1 cards | 2 FAB/tab bar/floating controls | 3 modal/sheet
// Shadows stay subtle; components should also keep a hairline border so the
// surface remains defined when shadows render weakly (e.g. Android/web).
// ---------------------------------------------------------------------------
type ElevationSpec = {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
};

const elevationSpecs = {
  none: {
    shadowColor: "#131B2E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: "#131B2E",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  floating: {
    shadowColor: "#131B2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: "#131B2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
} satisfies Record<string, ElevationSpec>;

function resolveShadow(spec: ElevationSpec): ViewStyle {
  if (Platform.OS === "android") {
    return { elevation: spec.elevation };
  }
  return {
    shadowColor: spec.shadowColor,
    shadowOffset: spec.shadowOffset,
    shadowOpacity: spec.shadowOpacity,
    shadowRadius: spec.shadowRadius,
  };
}

export const shadows = {
  none: resolveShadow(elevationSpecs.none),
  card: resolveShadow(elevationSpecs.card),
  floating: resolveShadow(elevationSpecs.floating),
  modal: resolveShadow(elevationSpecs.modal),
} satisfies Record<string, ViewStyle>;
