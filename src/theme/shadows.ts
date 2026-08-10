import { Platform } from "react-native";

export const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  default: {
    elevation: 4,
  },
});

export const shadowSm = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  default: {
    elevation: 2,
  },
});

export const shadowNav = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
  },
  default: {
    elevation: 8,
  },
});
