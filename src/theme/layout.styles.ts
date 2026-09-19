import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
    fontSize: 14,
  },
  errorTitle: {
    color: "#161c27",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 24,
  },
  errorMessage: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#1f4ed8",
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
