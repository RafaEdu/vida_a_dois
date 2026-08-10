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
  idempotencyBox: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FFE082",
    alignItems: "center",
  },
  idempotencyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F57F17",
    marginBottom: 6,
  },
  idempotencyText: {
    fontSize: 14,
    color: "#795548",
    textAlign: "center",
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    ...shadowSm,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowLabel: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: "600",
    color: C.onSurface,
  },
  divider: {
    height: 1,
    backgroundColor: C.surfaceVariant,
    marginVertical: 8,
  },
  projectionRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.surfaceVariant,
  },
  projectionText: {
    fontSize: 13,
    color: C.outline,
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 12,
    marginTop: 8,
  },
  list: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 4,
    ...shadowSm,
    marginBottom: 24,
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceVariant,
  },
  listLeft: {
    flex: 1,
    marginRight: 12,
  },
  listCategory: {
    fontSize: 12,
    color: C.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  listDescription: {
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  listTag: {
    fontSize: 10,
    color: C.outline,
    marginTop: 2,
  },
  listAmount: {
    fontSize: 15,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
    ...shadowSm,
  },
  closeButtonDisabled: {
    opacity: 0.6,
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  resultCard: {
    backgroundColor: "#F0FFF0",
    borderRadius: 16,
    padding: 24,
    ...shadowSm,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.progressGreen,
    textAlign: "center",
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  resultLabel: {
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: "600",
    color: C.onSurface,
  },
  resultDivider: {
    height: 1,
    backgroundColor: "#C8E6C9",
    marginVertical: 8,
  },
  backButton: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    ...shadowSm,
  },
  backButtonPressed: {
    opacity: 0.85,
  },
  backButtonText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  alreadyClosedCard: {
    backgroundColor: "#F3F0FF",
    borderRadius: 16,
    padding: 24,
    ...shadowSm,
    marginBottom: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D5CFF7",
  },
  alreadyClosedIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  alreadyClosedTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.primary,
    marginBottom: 8,
  },
  alreadyClosedText: {
    fontSize: 14,
    color: "#8E8CA6",
    textAlign: "center",
    lineHeight: 20,
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
