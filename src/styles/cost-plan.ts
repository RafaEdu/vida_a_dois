import { StyleSheet } from "react-native";
import { C } from "../../src/theme/colors";
import { shadowSm } from "../../src/theme/shadows";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 24,
  },
  budgetCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    ...shadowSm,
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 13,
    color: C.outline,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  budgetValue: {
    fontSize: 36,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 16,
  },
  budgetSubRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  budgetSubItem: {
    flex: 1,
    alignItems: "center",
  },
  budgetSubLabel: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginBottom: 2,
  },
  budgetSubValue: {
    fontSize: 18,
    fontWeight: "600",
  },
  budgetDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.outlineVariant,
  },
  splitCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    ...shadowSm,
    marginBottom: 24,
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 16,
    textAlign: "center",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  splitSide: {
    flex: 1,
    alignItems: "center",
  },
  splitAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.avatarRed,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  splitAvatarPartner: {
    backgroundColor: C.avatarTeal,
  },
  splitAvatarText: {
    color: C.onPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  splitName: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    fontWeight: "500",
    marginBottom: 4,
    maxWidth: 100,
  },
  splitPercent: {
    fontSize: 24,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 2,
  },
  splitAmount: {
    fontSize: 13,
    color: C.onSurfaceVariant,
  },
  splitDivider: {
    width: 1,
    height: 80,
    backgroundColor: C.outlineVariant,
  },
  balanceCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    ...shadowSm,
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: C.outline,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  idealCard: {
    backgroundColor: "#F3F0FF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E0D8F0",
  },
  idealTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  idealDescription: {
    fontSize: 12,
    color: C.outline,
    textAlign: "center",
    marginBottom: 14,
  },
  idealRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  idealPerson: {
    alignItems: "center",
  },
  idealName: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    fontWeight: "500",
    marginBottom: 4,
    maxWidth: 100,
  },
  idealPercent: {
    fontSize: 22,
    fontWeight: "700",
    color: C.primary,
  },
  idealVs: {
    fontSize: 18,
    color: C.outlineVariant,
    fontWeight: "300",
  },
  idealWarning: {
    fontSize: 12,
    color: "#FFB347",
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 12,
  },
  categoryList: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 16,
    ...shadowSm,
    marginBottom: 24,
  },
  categoryItem: {
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    fontWeight: "500",
  },
  categoryAmount: {
    fontSize: 14,
    color: C.onSurface,
    fontWeight: "600",
  },
  categoryBar: {
    height: 6,
    backgroundColor: C.surfaceVariant,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 4,
  },
  categoryBarFill: {
    height: "100%",
    backgroundColor: C.primary,
    borderRadius: 3,
  },
  categoryPercent: {
    fontSize: 11,
    color: C.outline,
  },
  editButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    ...shadowSm,
  },
  editButtonPressed: {
    opacity: 0.85,
  },
  editButtonText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
});
