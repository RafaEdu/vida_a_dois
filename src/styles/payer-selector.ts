import { StyleSheet } from "react-native";
import { colors, fontFamilies, radius, spacing } from "../theme";

export const payerSelectorStyles = StyleSheet.create({
  paidByRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  paidByOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 56,
  },
  paidByOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  paidByAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.partnerASoft,
    justifyContent: "center",
    alignItems: "center",
  },
  paidByAvatarPartner: {
    backgroundColor: colors.partnerBSoft,
  },
  paidByAvatarText: {
    fontFamily: fontFamilies.jakarta.bold,
    fontSize: 15,
    color: colors.partnerA,
  },
  paidByAvatarTextPartner: {
    color: colors.partnerB,
  },
  paidByName: {
    fontFamily: fontFamilies.inter.medium,
    fontSize: 14,
    color: colors.textSecondary,
  },
  paidByNameSelected: {
    color: colors.primary,
    fontFamily: fontFamilies.inter.semibold,
  },
});
