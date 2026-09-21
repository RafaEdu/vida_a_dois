import { StyleSheet } from "react-native";
import { C } from "../theme/colors";

export const formStyles = StyleSheet.create({
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
  fieldError: {
    color: C.error,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
  },
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
  plainErrorBox: {
    backgroundColor: C.errorContainer,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  plainErrorText: {
    color: C.error,
    fontSize: 14,
  },
  button: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  buttonText: {
    color: C.onPrimary,
    fontSize: 17,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
