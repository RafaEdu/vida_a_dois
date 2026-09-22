import { StyleSheet, View } from "react-native";
import { spacing } from "../../../theme";
import {
  AppText,
  Avatar,
  Badge,
  Card,
  MoneyText,
  SectionHeader,
  type AvatarTone,
} from "../../../components/ui";

interface PartnerCardProps {
  name: string;
  initials: string;
  avatarUrl?: string | null;
  tone: AvatarTone;
  roleLabel: string;
  income: number | null;
}

function PartnerCard({
  name,
  initials,
  avatarUrl,
  tone,
  roleLabel,
  income,
}: PartnerCardProps) {
  return (
    <Card padded style={styles.partnerCard}>
      <Avatar initials={initials} uri={avatarUrl} tone={tone} size="lg" />
      <AppText variant="bodySmallMedium" align="center" numberOfLines={2}>
        {name}
      </AppText>
      <Badge
        label={roleLabel}
        tone={tone === "partnerA" ? "partnerA" : "partnerB"}
      />
      <View style={styles.income}>
        <AppText variant="labelCaps" color="textSecondary">
          Renda mensal
        </AppText>
        {income != null ? (
          <MoneyText value={income} variant="bodySmallMedium" />
        ) : (
          <AppText variant="bodySmall" color="textSecondary">
            Não informada
          </AppText>
        )}
      </View>
    </Card>
  );
}

export interface CouplePartnersProps {
  selfName: string;
  selfInitials: string;
  selfIncome: number | null;
  selfAvatarUrl?: string | null;
  partnerName: string;
  partnerInitials: string;
  partnerIncome: number | null;
  partnerAvatarUrl?: string | null;
}

export function CouplePartners({
  selfName,
  selfInitials,
  selfIncome,
  selfAvatarUrl,
  partnerName,
  partnerInitials,
  partnerIncome,
  partnerAvatarUrl,
}: CouplePartnersProps) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Parceiros"
        subtitle="As duas pessoas deste casal, com o mesmo peso"
      />
      <View style={styles.row}>
        <PartnerCard
          name={selfName}
          initials={selfInitials}
          avatarUrl={selfAvatarUrl}
          tone="partnerA"
          roleLabel="Você"
          income={selfIncome}
        />
        <PartnerCard
          name={partnerName}
          initials={partnerInitials}
          avatarUrl={partnerAvatarUrl}
          tone="partnerB"
          roleLabel="Parceiro"
          income={partnerIncome}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: spacing.md,
  },
  partnerCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  income: {
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
});
