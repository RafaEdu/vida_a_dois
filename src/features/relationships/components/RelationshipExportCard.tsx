import { useState, type ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useCouple } from "../../../providers/CoupleProvider";
import { fetchExportDataset } from "../../../services/export";
import { shareExportFile } from "../../../lib/exportShare";
import {
  buildClosingsCsv,
  buildExpensesCsv,
  buildIncomesCsv,
  buildJsonBackup,
  buildMonthlySummaryCsv,
  type ExportDataset,
  type ExportFile,
} from "../../../domain/export/builders";
import type { Couple } from "../../../types/domain";
import { colors, radius, spacing } from "../../../theme";
import { AppText, Button, Card } from "../../../components/ui";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

interface ExportOption {
  id: string;
  label: string;
  hint: string;
  icon: IconName;
  build: (dataset: ExportDataset) => ExportFile;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: "expenses",
    label: "Despesas (CSV)",
    hint: "Todos os lançamentos de despesa",
    icon: "receipt-long",
    build: buildExpensesCsv,
  },
  {
    id: "incomes",
    label: "Receitas (CSV)",
    hint: "Todos os lançamentos de receita",
    icon: "savings",
    build: buildIncomesCsv,
  },
  {
    id: "closings",
    label: "Fechamentos (CSV)",
    hint: "Snapshots consolidados mês a mês",
    icon: "event-available",
    build: buildClosingsCsv,
  },
  {
    id: "summary",
    label: "Resumo mensal (CSV)",
    hint: "Receitas, despesas e saldo por mês",
    icon: "calendar-month",
    build: buildMonthlySummaryCsv,
  },
  {
    id: "backup",
    label: "Backup completo (JSON)",
    hint: "Despesas, receitas, fechamentos e metas",
    icon: "backup",
    build: buildJsonBackup,
  },
];

/**
 * Ações de exportação de um relacionamento. Cada opção lê os dados via RLS
 * (somente o vínculo informado), gera o arquivo em memória e usa o
 * compartilhamento nativo do Expo. O arquivo temporário é removido pelo
 * `shareExportFile`.
 */
export function RelationshipExportCard({ couple }: { couple: Couple }) {
  const { profile } = useCouple();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleExport = async (option: ExportOption) => {
    if (!profile || busyId) return;

    setBusyId(option.id);
    setError("");
    setMessage("");

    try {
      const result = await fetchExportDataset(couple, {
        id: profile.id,
        full_name: profile.full_name,
      });
      if (result.error) {
        setError(result.error.message);
        return;
      }

      const file = option.build(result.data);
      const shared = await shareExportFile(file);
      if (shared.error) {
        setError(shared.error);
        return;
      }
      setMessage(`${option.label} pronto para compartilhar.`);
    } catch {
      setError("Não foi possível exportar agora.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card padded style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="download" size={20} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="bodySemibold">Exportar dados</AppText>
          <AppText variant="bodySmall" color="textSecondary">
            Arquivos CSV e JSON com tudo o que você pode acessar neste vínculo.
          </AppText>
        </View>
      </View>

      <View style={styles.options}>
        {EXPORT_OPTIONS.map((option) => (
          <View key={option.id} style={styles.option}>
            <Button
              title={option.label}
              icon={option.icon}
              variant="secondary"
              size="md"
              fullWidth
              loading={busyId === option.id}
              disabled={!profile || busyId !== null}
              onPress={() => void handleExport(option)}
              accessibilityLabel={`Exportar ${option.label}`}
            />
            <AppText variant="label" color="textSecondary">
              {option.hint}
            </AppText>
          </View>
        ))}
      </View>

      {error ? (
        <AppText variant="bodySmall" color="danger">
          {error}
        </AppText>
      ) : null}
      {message ? (
        <AppText variant="bodySmall" color="success">
          {message}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  options: {
    gap: spacing.md,
  },
  option: {
    gap: spacing.xs,
  },
});
