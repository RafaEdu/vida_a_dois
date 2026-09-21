import { StyleSheet } from "react-native";
import { C } from "../theme/colors";

export const payerSelectorStyles = StyleSheet.create({
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
});
