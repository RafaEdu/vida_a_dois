import { StyleSheet } from "react-native";
import { C } from "../../src/theme/colors";
import { shadowSm } from "../../src/theme/shadows";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: C.onSurfaceVariant,
  },
  form: {
    flex: 1,
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
  button: {
    backgroundColor: C.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
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
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: C.onSurfaceVariant,
    fontSize: 14,
  },
  loginAction: {
    color: C.primary,
    fontSize: 14,
    fontWeight: "600",
  },
});
