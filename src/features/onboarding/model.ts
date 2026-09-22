/**
 * Human-friendly invite code, e.g. `A7F3-B2C1`. Returns the normalized code
 * without separator when it does not have the expected 8 characters yet, and a
 * placeholder when there is no code.
 */
export function formatInviteCode(code: string | null | undefined): string {
  const normalized = (code ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  if (!normalized) return "— — —";
  if (normalized.length !== 8) return normalized;
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
}
