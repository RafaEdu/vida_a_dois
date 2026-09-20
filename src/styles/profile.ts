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
  avatarContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.avatarRed,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: C.onPrimary,
    fontSize: 32,
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
    ...shadowSm,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceVariant,
  },
  infoLabel: {
    fontSize: 14,
    color: C.outline,
  },
  infoValue: {
    fontSize: 15,
    color: C.onSurface,
    fontWeight: "500",
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    marginBottom: 6,
  },
  input: {
    backgroundColor: C.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: C.onSurface,
  },
  editButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    ...shadowSm,
  },
  buttonDisabled: {
    backgroundColor: C.primaryFixedDim,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: C.surfaceVariant,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonPressed: {
    opacity: 0.7,
  },
  cancelButtonText: {
    color: C.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
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
  signOutButton: {
    alignItems: "center",
    paddingVertical: 16,
  },
  signOutButtonPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: C.outline,
    fontSize: 15,
    fontWeight: "600",
  },
});
