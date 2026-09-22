import type { Expense, Income } from "../../types/domain";
import type { TransactionStatus } from "../../components/finance/TransactionRow";
import type { CategoryIconName } from "../../utils/category";
import { getCategoryIcon } from "../../utils/category";
import { formatDateGroupLabel } from "../../utils/date";
import { payerMeta, receiverMeta } from "../../utils/transaction";

export type TransactionKind = "expense" | "income";
export type TransactionTypeFilter = "all" | TransactionKind;
export type TransactionPersonFilter = "all" | "self" | "partner";
export type TransactionStatusFilter = "all" | "paid" | "pending";

export interface TransactionFilterState {
  type: TransactionTypeFilter;
  person: TransactionPersonFilter;
  /** Expense category, or `null` for all categories. */
  category: string | null;
  status: TransactionStatusFilter;
}

export const EMPTY_TRANSACTION_FILTERS: TransactionFilterState = {
  type: "all",
  person: "all",
  category: null,
  status: "all",
};

export interface TransactionIdentity {
  selfId?: string;
  partnerId?: string;
  partnerName?: string | null;
}

export interface TransactionEntry {
  id: string;
  kind: TransactionKind;
  title: string;
  subtitle?: string;
  meta?: string;
  amount: number;
  /** Sortable `YYYY-MM-DD` key. Empty when the record has no date. */
  dateKey: string;
  createdAt: string;
  category?: string;
  icon: CategoryIconName;
  recurring: boolean;
  status: TransactionStatus;
  paid: boolean;
  personId: string | null;
}

export interface TransactionGroup {
  dateKey: string;
  label: string;
  data: TransactionEntry[];
}

function dateKeyOf(timestamp: string | null | undefined): string {
  return timestamp ? timestamp.slice(0, 10) : "";
}

export function createExpenseEntry(
  expense: Expense,
  identity: TransactionIdentity,
): TransactionEntry {
  return {
    id: expense.id,
    kind: "expense",
    title: expense.description || expense.category || "Despesa",
    subtitle: expense.category || undefined,
    meta: payerMeta(
      expense.paid_by,
      identity.selfId,
      identity.partnerId,
      identity.partnerName,
    ),
    amount: expense.amount,
    dateKey: expense.due_date ?? dateKeyOf(expense.created_at),
    createdAt: expense.created_at ?? "",
    category: expense.category,
    icon: getCategoryIcon(expense.category ?? ""),
    recurring: expense.is_recurring,
    paid: expense.paid,
    personId: expense.paid_by ?? null,
    status: expense.paid
      ? { label: "Pago", tone: "success", icon: "check-circle" }
      : { label: "Pendente", tone: "warning", icon: "schedule" },
  };
}

export function createIncomeEntry(
  income: Income,
  identity: TransactionIdentity,
): TransactionEntry {
  return {
    id: income.id,
    kind: "income",
    title: income.description || "Receita",
    subtitle: income.is_extra ? "Extra" : "Salário",
    meta: receiverMeta(income.user_id, identity.selfId, identity.partnerName),
    amount: income.amount,
    dateKey: dateKeyOf(income.received_at) || dateKeyOf(income.created_at),
    createdAt: income.created_at ?? "",
    icon: "trending-up",
    recurring: false,
    paid: true,
    personId: income.user_id ?? null,
    status: { label: "Recebido", tone: "success", icon: "check-circle" },
  };
}

export function sortTransactionEntries(
  entries: TransactionEntry[],
): TransactionEntry[] {
  return [...entries].sort((a, b) => {
    const byDate = b.dateKey.localeCompare(a.dateKey);
    if (byDate !== 0) return byDate;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function buildTransactionEntries(
  expenses: Expense[],
  incomes: Income[],
  identity: TransactionIdentity,
): TransactionEntry[] {
  return sortTransactionEntries([
    ...expenses.map((expense) => createExpenseEntry(expense, identity)),
    ...incomes.map((income) => createIncomeEntry(income, identity)),
  ]);
}

export function filterTransactionEntries(
  entries: TransactionEntry[],
  filters: TransactionFilterState,
  identity: TransactionIdentity,
): TransactionEntry[] {
  return entries.filter((entry) => {
    if (filters.type !== "all" && entry.kind !== filters.type) return false;

    if (filters.person === "self") {
      if (!identity.selfId || entry.personId !== identity.selfId) return false;
    } else if (filters.person === "partner") {
      if (!identity.partnerId || entry.personId !== identity.partnerId) {
        return false;
      }
    }

    if (
      filters.category &&
      (entry.kind !== "expense" || entry.category !== filters.category)
    ) {
      return false;
    }

    if (filters.status !== "all") {
      if (entry.kind !== "expense") return false;
      if (filters.status === "paid" && !entry.paid) return false;
      if (filters.status === "pending" && entry.paid) return false;
    }

    return true;
  });
}

export function groupTransactionEntries(
  entries: TransactionEntry[],
  today?: Date,
): TransactionGroup[] {
  const groups = new Map<string, TransactionEntry[]>();

  for (const entry of entries) {
    const bucket = groups.get(entry.dateKey);
    if (bucket) bucket.push(entry);
    else groups.set(entry.dateKey, [entry]);
  }

  return Array.from(groups, ([dateKey, data]) => ({
    dateKey,
    label: formatDateGroupLabel(dateKey, today),
    data,
  }));
}

export function hasActiveTransactionFilters(
  filters: TransactionFilterState,
): boolean {
  return (
    filters.type !== "all" ||
    filters.person !== "all" ||
    filters.category !== null ||
    filters.status !== "all"
  );
}

export function collectExpenseCategories(expenses: Expense[]): string[] {
  const categories = new Set<string>();
  for (const expense of expenses) {
    if (expense.category) categories.add(expense.category);
  }
  return Array.from(categories).sort((a, b) => a.localeCompare(b));
}
