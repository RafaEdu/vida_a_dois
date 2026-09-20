import { StyleSheet } from "react-native";
import { C } from "../../src/theme/colors";
import { shadowSm } from "../../src/theme/shadows";

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: C.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  step: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "600",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
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
  optionalHint: {
    fontSize: 12,
    color: C.outline,
    marginTop: 6,
    fontStyle: "italic",
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
});
