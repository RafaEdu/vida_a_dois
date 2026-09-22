import { StyleSheet } from "react-native";
import { colors, fontFamilies, radius, shadows, spacing } from "../theme";

export const categoryPickerStyles = StyleSheet.create({
  selector: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    flex: 1,
    fontFamily: fontFamilies.inter.medium,
    fontSize: 16,
    color: colors.text,
  },
  categoryList: {
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadows.floating,
  },
  categoryScroll: {
    maxHeight: 280,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  categoryItemSelected: {
    backgroundColor: colors.surfaceSubtle,
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
    fontFamily: fontFamilies.inter.medium,
    fontSize: 14,
    color: colors.text,
  },
  categoryNameSelected: {
    color: colors.primary,
    fontFamily: fontFamilies.inter.semibold,
  },
  categoryType: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  chipRow: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontFamily: fontFamilies.inter.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.primary,
    fontFamily: fontFamilies.inter.semibold,
  },
});
