import { StyleSheet } from "react-native";
import { C } from "../../src/theme/colors";
import { shadow } from "../../src/theme/shadows";

export const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.surface,
  },
  tabs: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 8,
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: C.surfaceContainerLowest,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },
  tabTextActive: {
    color: C.primary,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  empty: {
    textAlign: "center",
    marginTop: 40,
    color: C.onSurfaceVariant,
    fontSize: 14,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    ...shadow,
  },
  itemMain: {
    flex: 1,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: C.onSurface,
  },
  itemMeta: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    marginTop: 2,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 12,
  },
  modalError: {
    color: C.error,
    fontSize: 13,
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: C.onSurface,
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
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.surfaceContainerLow,
    alignItems: "center",
  },
  modalCancelText: {
    color: C.onSurfaceVariant,
    fontWeight: "600",
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: C.primary,
    alignItems: "center",
  },
  modalSaveDisabled: {
    opacity: 0.6,
  },
  modalSaveText: {
    color: C.onPrimary,
    fontWeight: "700",
  },
});
