import type { Couple } from "../types/domain";

export type LoadStatus = "loading" | "ready" | "error";
export type BootstrapStatus = LoadStatus;
export type FinanceLoadStatus = "idle" | "loading" | "ready";

export function deriveCoupleLoadStatus(params: {
  userId: string | null;
  loadedUserId: string | null;
  internalStatus: LoadStatus;
}): LoadStatus {
  const { userId, loadedUserId, internalStatus } = params;

  if (!userId) return "ready";
  if (internalStatus === "error") return "error";
  if (internalStatus === "ready" && loadedUserId === userId) return "ready";
  return "loading";
}

export function deriveFinanceLoadStatus(params: {
  coupleId: string | null;
  coupleStatus: Couple["status"] | null | undefined;
  loadedCoupleId: string | null;
}): FinanceLoadStatus {
  const { coupleId, coupleStatus, loadedCoupleId } = params;

  if (!coupleId || coupleStatus !== "active") return "idle";
  if (loadedCoupleId === coupleId) return "ready";
  return "loading";
}

export function deriveBootstrapStatus(
  authStatus: LoadStatus,
  coupleStatus: LoadStatus,
): LoadStatus {
  if (authStatus === "error" || coupleStatus === "error") return "error";
  if (authStatus === "loading" || coupleStatus === "loading") return "loading";
  return "ready";
}

export function isBootstrapLoading(
  authStatus: LoadStatus,
  coupleStatus: LoadStatus,
  financeStatus: FinanceLoadStatus,
): boolean {
  return (
    authStatus === "loading" ||
    coupleStatus === "loading" ||
    financeStatus === "loading"
  );
}
