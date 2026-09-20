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
  /* Switch */
  switchCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 28,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      default: { elevation: 2 },
    }),
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
