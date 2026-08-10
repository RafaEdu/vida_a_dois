import { StyleSheet } from "react-native";
import { C } from "../../src/theme/colors";

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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: C.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
    alignItems: "center",
  },
  step: {
    fontSize: 13,
    color: C.primary,
    fontWeight: "600",
    marginBottom: 32,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: C.errorContainer,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    width: "100%",
  },
  errorText: {
    color: C.error,
    fontSize: 14,
    textAlign: "center",
  },
  codeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    backgroundColor: C.surfaceContainerLowest,
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: C.onSurface,
  },
  codeInputFilled: {
    borderColor: C.primary,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonPressed: {
    opacity: 0.7,
  },
  resendText: {
    fontSize: 14,
    color: C.primary,
    fontWeight: "600",
  },
  verifying: {
    fontSize: 14,
    color: C.outline,
    marginTop: 16,
  },
});
