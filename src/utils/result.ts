export type AppErrorCode =
  "network" | "permission" | "not_found" | "validation" | "unknown";

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export type ServiceResult<T> =
  { data: T; error: null } | { data: null; error: AppError };

export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null };
}

export function fail(error: AppError): ServiceResult<never> {
  return { data: null, error };
}

const POSTGRES_CODE_MAP: Record<string, AppErrorCode> = {
  "42501": "permission",
  PGRST301: "permission",
  PGRST116: "not_found",
  "23505": "validation",
  "23514": "validation",
  "23503": "validation",
  "22P02": "validation",
  "22000": "validation",
};

const NETWORK_ERROR_PATTERN =
  /network request failed|failed to fetch|network error|aborted|timeout/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function toAppError(
  error: unknown,
  fallbackMessage = "Ocorreu um erro inesperado.",
): AppError {
  if (error instanceof Error) {
    const isNetwork =
      error.name === "AbortError" ||
      error.name === "TypeError" ||
      NETWORK_ERROR_PATTERN.test(error.message);

    return {
      code: isNetwork ? "network" : "unknown",
      message: error.message || fallbackMessage,
      cause: error,
    };
  }

  if (isRecord(error)) {
    const rawCode = typeof error.code === "string" ? error.code : undefined;
    const message =
      typeof error.message === "string" && error.message.length > 0
        ? error.message
        : fallbackMessage;

    return {
      code: rawCode ? (POSTGRES_CODE_MAP[rawCode] ?? "unknown") : "unknown",
      message,
      cause: error,
    };
  }

  return { code: "unknown", message: fallbackMessage, cause: error };
}

export function extractDomainError(data: unknown): string | null {
  if (
    isRecord(data) &&
    typeof data.error === "string" &&
    data.error.length > 0
  ) {
    return data.error;
  }
  return null;
}

export function rpcToAppError(
  rpcData: unknown,
  rpcError: unknown,
  fallbackMessage: string,
): AppError {
  const domainMessage = extractDomainError(rpcData);
  if (domainMessage) {
    return { code: "validation", message: domainMessage, cause: rpcData };
  }
  return toAppError(rpcError, fallbackMessage);
}
