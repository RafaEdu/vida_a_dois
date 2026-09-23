import { supabase } from "../lib/supabase";
import type { Couple, CoupleActivity, Expense, Income } from "../types/domain";
import { sortExpenses, sortIncomes } from "../domain/finance/order";

export type RealtimePayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: { id: string };
};

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const withoutItem = list.filter((x) => x.id !== item.id);
  return [item, ...withoutItem];
}

export function applyExpenseDelta(
  list: Expense[],
  payload: RealtimePayload<Expense>,
): Expense[] {
  if (payload.eventType === "DELETE") {
    return list.filter((x) => x.id !== payload.old.id);
  }
  return sortExpenses(upsert(list, payload.new));
}

export function applyIncomeDelta(
  list: Income[],
  payload: RealtimePayload<Income>,
): Income[] {
  if (payload.eventType === "DELETE") {
    return list.filter((x) => x.id !== payload.old.id);
  }
  return sortIncomes(upsert(list, payload.new));
}

export function subscribeToCoupleChanges(
  coupleId: string,
  onUpdate: (couple: Couple) => void,
): () => void {
  const channel = supabase
    .channel(`couple-${coupleId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "couples",
        filter: `id=eq.${coupleId}`,
      },
      (payload) => onUpdate(payload.new as Couple),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToCoupleInvites(
  userId: string,
  handlers: {
    onInsert?: () => void;
    onDelete?: () => void;
  },
): () => void {
  const onInsert = () => handlers.onInsert?.();
  const onDelete = () => handlers.onDelete?.();

  const channel = supabase
    .channel(`couples-insert-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "couples",
        filter: `user_a=eq.${userId}`,
      },
      onInsert,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "couples",
        filter: `user_b=eq.${userId}`,
      },
      onInsert,
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "couples",
        filter: `user_a=eq.${userId}`,
      },
      onDelete,
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "couples",
        filter: `user_b=eq.${userId}`,
      },
      onDelete,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Assina os novos eventos de atividade do vínculo. O feed é append-only, então
 * só INSERT importa; a RLS continua valendo no canal de realtime.
 */
export function subscribeToCoupleActivity(
  coupleId: string,
  onInsert: (activity: CoupleActivity) => void,
): () => void {
  const channel = supabase
    .channel(`activity-${coupleId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "couple_activity",
        filter: `couple_id=eq.${coupleId}`,
      },
      (payload) => onInsert(payload.new as CoupleActivity),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToFinance(
  coupleId: string,
  handlers: {
    onExpense: (payload: RealtimePayload<Expense>) => void;
    onIncome: (payload: RealtimePayload<Income>) => void;
  },
): () => void {
  const handleExpense = (payload: unknown) =>
    handlers.onExpense(payload as RealtimePayload<Expense>);
  const handleIncome = (payload: unknown) =>
    handlers.onIncome(payload as RealtimePayload<Income>);

  const channel = supabase
    .channel(`finance-${coupleId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "expenses",
        filter: `couple_id=eq.${coupleId}`,
      },
      handleExpense,
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "expenses",
        filter: `couple_id=eq.${coupleId}`,
      },
      handleExpense,
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "expenses",
        filter: `couple_id=eq.${coupleId}`,
      },
      handleExpense,
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "incomes",
        filter: `couple_id=eq.${coupleId}`,
      },
      handleIncome,
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "incomes",
        filter: `couple_id=eq.${coupleId}`,
      },
      handleIncome,
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "incomes",
        filter: `couple_id=eq.${coupleId}`,
      },
      handleIncome,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
