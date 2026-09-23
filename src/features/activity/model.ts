import type { ComponentProps } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import type { BadgeTone } from "../../components/ui";
import type { ActivityEventType, CoupleActivity } from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import { formatYearMonthLong } from "../../utils/date";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

export interface ActivityDescriptor {
  title: string;
  description: string;
  icon: IconName;
  tone: BadgeTone;
}

const EVENT_ICONS: Record<ActivityEventType, IconName> = {
  expense_paid: "check-circle",
  month_closed: "event-available",
  budget_changed: "account-balance-wallet",
  split_changed: "pie-chart",
  goal_completed: "flag",
  recurrence_ended: "autorenew",
  relationship_ended: "link-off",
};

const EVENT_TONES: Record<ActivityEventType, BadgeTone> = {
  expense_paid: "success",
  month_closed: "primary",
  budget_changed: "shared",
  split_changed: "shared",
  goal_completed: "success",
  recurrence_ended: "warning",
  relationship_ended: "danger",
};

function metadataOf(activity: CoupleActivity): Record<string, unknown> {
  const value = activity.metadata;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Traduz um evento do feed em texto e ícone, lendo apenas o metadata mínimo
 * gravado pelo banco. Nunca revela dados de outro casal além do que a RLS já
 * entregou.
 */
export function describeActivity(activity: CoupleActivity): ActivityDescriptor {
  const metadata = metadataOf(activity);
  const icon = EVENT_ICONS[activity.event_type] ?? "history";
  const tone = EVENT_TONES[activity.event_type] ?? "neutral";

  switch (activity.event_type) {
    case "expense_paid": {
      const description = asString(metadata.description) ?? "Despesa";
      const amount = asNumber(metadata.amount);
      return {
        title: "Despesa paga",
        description:
          amount != null
            ? `${description} • ${formatCurrency(amount)}`
            : description,
        icon,
        tone,
      };
    }
    case "month_closed": {
      const yearMonth = asString(metadata.year_month);
      return {
        title: "Mês fechado",
        description: yearMonth
          ? `Fechamento de ${formatYearMonthLong(yearMonth) || yearMonth}`
          : "O mês foi consolidado no caixa comum.",
        icon,
        tone,
      };
    }
    case "budget_changed": {
      const category = asString(metadata.category);
      return {
        title: "Orçamento ajustado",
        description: category
          ? `Limite mensal de ${category} atualizado.`
          : "O orçamento do casal foi atualizado.",
        icon,
        tone,
      };
    }
    case "split_changed": {
      const ratioA = asNumber(metadata.split_ratio_a);
      const ratioB = asNumber(metadata.split_ratio_b);
      return {
        title: "Divisão atualizada",
        description:
          ratioA != null && ratioB != null
            ? `Nova divisão: ${ratioA}% / ${ratioB}%.`
            : "A forma de divisão do casal foi atualizada.",
        icon,
        tone,
      };
    }
    case "goal_completed": {
      const title = asString(metadata.title);
      return {
        title: "Meta concluída",
        description: title
          ? `A meta "${title}" foi concluída.`
          : "Uma meta do casal foi concluída.",
        icon,
        tone,
      };
    }
    case "recurrence_ended": {
      const description = asString(metadata.description);
      return {
        title: "Recorrência encerrada",
        description: description
          ? `A recorrência "${description}" foi encerrada.`
          : "Uma recorrência foi encerrada.",
        icon,
        tone,
      };
    }
    case "relationship_ended":
    default:
      return {
        title: "Vínculo encerrado",
        description:
          "O relacionamento foi encerrado e agora está disponível apenas para consulta.",
        icon,
        tone,
      };
  }
}
