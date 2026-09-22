/**
 * Shared presentation helpers for attributing a transaction to one of the two
 * partners. Kept pure so Home and Transactions render the same copy.
 */
export function payerMeta(
  paidBy: string | null | undefined,
  selfId: string | undefined,
  partnerId: string | undefined,
  partnerName: string | null | undefined,
): string | undefined {
  if (!paidBy) return undefined;
  if (paidBy === selfId) return "Pago por você";
  if (paidBy === partnerId) return `Pago por ${partnerName ?? "parceiro"}`;
  return undefined;
}

export function receiverMeta(
  userId: string | null | undefined,
  selfId: string | undefined,
  partnerName: string | null | undefined,
): string | undefined {
  if (!userId) return undefined;
  if (userId === selfId) return "Recebido por você";
  return `Recebido por ${partnerName ?? "parceiro"}`;
}
