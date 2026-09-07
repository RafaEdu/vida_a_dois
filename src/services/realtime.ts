import type { Expense, Income } from "../types/database";

export type RealtimePayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: { id: string };
};

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const exists = list.some((x) => x.id === item.id);
  if (!exists) return [item, ...list];
  return list.map((x) => (x.id === item.id ? item : x));
}

export function applyExpenseDelta(
  list: Expense[],
  payload: RealtimePayload<Expense>,
): Expense[] {
  if (payload.eventType === "DELETE") {
    return list.filter((x) => x.id !== payload.old.id);
  }
  return upsert(list, payload.new);
}

export function applyIncomeDelta(
  list: Income[],
  payload: RealtimePayload<Income>,
): Income[] {
  if (payload.eventType === "DELETE") {
    return list.filter((x) => x.id !== payload.old.id);
  }
  return upsert(list, payload.new);
}
