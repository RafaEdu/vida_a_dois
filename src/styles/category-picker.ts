import { StyleSheet, Platform } from "react-native";
import { C } from "../theme/colors";

export const categoryPickerStyles = StyleSheet.create({
  selector: {
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    fontSize: 16,
    fontWeight: "500",
    color: C.onSurface,
    flex: 1,
  },
  categoryList: {
    marginTop: 4,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      default: { elevation: 4 },
    }),
  },
  categoryScroll: {
    maxHeight: 280,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F3F8",
    gap: 12,
  },
  categoryItemSelected: {
    backgroundColor: C.surfaceContainerLow,
  },
  categoryIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurface,
  },
  categoryNameSelected: {
    color: C.primary,
    fontWeight: "600",
  },
  categoryType: {
    fontSize: 11,
    color: C.onSurfaceVariant,
    marginTop: 1,
  },
  chipRow: {
    paddingVertical: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  chipActive: {
    backgroundColor: C.primaryContainer,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  chipTextActive: {
    color: C.onPrimaryContainer,
    fontWeight: "600",
  },
});
