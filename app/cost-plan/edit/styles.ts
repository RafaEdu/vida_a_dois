import { StyleSheet, Platform } from "react-native";
import { C } from "../../../src/theme/colors";
import { shadowSm } from "../../../src/theme/shadows";

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
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: C.errorContainer,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: C.error,
    fontSize: 14,
  },
  card: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    ...shadowSm,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: C.onSurfaceVariant,
    marginBottom: 16,
  },
  currencyInput: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "700",
    color: C.onSurface,
    paddingVertical: 4,
  },
  splitContainer: {
    alignItems: "center",
  },
  splitPerson: {
    alignItems: "center",
    paddingVertical: 12,
  },
  splitAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 20,
    fontWeight: "700",
  },
  splitName: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    fontWeight: "500",
    marginBottom: 8,
    maxWidth: 140,
  },
  percentInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  percentField: {
    fontSize: 36,
    fontWeight: "700",
    color: C.primary,
    minWidth: 60,
    textAlign: "center",
    paddingVertical: 4,
  },
  percentReadonly: {
    color: C.avatarTeal,
  },
  percentSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    marginLeft: 4,
  },
  splitSeparator: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  splitLine: {
    width: 60,
    height: 1,
    backgroundColor: C.outlineVariant,
  },
  splitOr: {
    fontSize: 18,
    color: C.outlineVariant,
    marginHorizontal: 12,
    fontWeight: "300",
  },
  idealSuggestion: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: C.surfaceVariant,
    alignItems: "center",
  },
  idealSuggestionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 4,
  },
  idealSuggestionText: {
    fontSize: 14,
    color: C.onSurfaceVariant,
    marginBottom: 2,
  },
  idealSuggestionHint: {
    fontSize: 11,
    color: C.outline,
    marginBottom: 12,
    textAlign: "center",
  },
  useIdealButton: {
    backgroundColor: C.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  useIdealButtonPressed: {
    opacity: 0.8,
  },
  useIdealButtonText: {
    color: C.onPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    marginTop: 8,
    ...shadowSm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: C.outline,
    fontSize: 15,
    fontWeight: "600",
  },
});
