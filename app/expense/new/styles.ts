import { StyleSheet, Platform } from "react-native";
import { C } from "../../../src/theme/colors";
import { shadowSm } from "../../../src/theme/shadows";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.surface,
  },
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: C.surface,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.onSurface,
  },
  /* Scroll */
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 24,
  },
  /* Error */
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: C.errorContainer,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    color: C.onErrorContainer,
    fontSize: 14,
    fontWeight: "500",
  },
  /* Fields */
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: "500",
    color: C.onSurface,
  },
  /* Selector (Category) */
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
  /* Category List */
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
  /* Paid By */
  paidByRow: {
    flexDirection: "row",
    gap: 12,
  },
  paidByOption: {
    flex: 1,
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 2,
    borderColor: C.outlineVariant,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  paidByOptionSelected: {
    borderColor: C.primary,
    backgroundColor: C.surfaceContainerLow,
  },
  paidByAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.avatarRed,
    justifyContent: "center",
    alignItems: "center",
  },
  paidByAvatarPartner: {
    backgroundColor: C.avatarTeal,
  },
  paidByAvatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  paidByName: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    fontWeight: "500",
  },
  paidByNameSelected: {
    color: C.primary,
    fontWeight: "600",
  },
  /* Switches */
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: C.onSurface,
  },
  switchHint: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
    maxWidth: 230,
  },
  /* Save */
  saveBtn: {
    flexDirection: "row",
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      default: { elevation: 4 },
    }),
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    color: C.onPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  /* Cancel */
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 14,
    marginBottom: 20,
  },
  cancelBtnPressed: {
    opacity: 0.7,
  },
  cancelBtnText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "600",
  },
});
