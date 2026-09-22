import { StyleSheet, View } from "react-native";
import { Controller, type Control } from "react-hook-form";
import type { PartnerLookup } from "../../../types/domain";
import type { PartnerCodeFormInput } from "../../../domain/account/schemas";
import { FormError, FormField, TextField } from "../../../components/forms";
import { AppText, Avatar, Badge, Button, Card } from "../../../components/ui";
import { spacing } from "../../../theme";
import { getInitials } from "../../../utils/initials";
import { InviteCodeCard } from "./InviteCodeCard";
import { OnboardingHeader } from "./OnboardingHeader";
import { PartnerConnection } from "./PartnerConnection";

export interface LinkRequestViewProps {
  selfInitials: string;
  inviteCode: string | null | undefined;
  copied: boolean;
  onCopy: () => void;
  control: Control<PartnerCodeFormInput>;
  codeError?: string;
  codeComplete: boolean;
  lookingUp: boolean;
  linking: boolean;
  submitError: string;
  foundPartner: PartnerLookup | null;
  onLookup: () => void;
  onLink: () => void;
}

/** First-time linking: share your code and insert your partner's code. */
export function LinkRequestView({
  selfInitials,
  inviteCode,
  copied,
  onCopy,
  control,
  codeError,
  codeComplete,
  lookingUp,
  linking,
  submitError,
  foundPartner,
  onLookup,
  onLink,
}: LinkRequestViewProps) {
  return (
    <>
      <OnboardingHeader
        title="Vincular parceiro"
        subtitle="Conecte-se com a pessoa que vai compartilhar a vida financeira com você"
      />

      <PartnerConnection
        left={{ initials: selfInitials, tone: "partnerA" }}
        right={{ initials: "?", empty: true }}
        accessibilityLabel="Você ainda não tem um parceiro vinculado"
      />

      <InviteCodeCard code={inviteCode} onCopy={onCopy} copied={copied} />

      <AppText variant="bodySmall" color="textSecondary" align="center">
        Compartilhe este código com seu parceiro e insira o código dele abaixo
      </AppText>

      <FormError message={submitError} />

      <FormField label="Código do parceiro" error={codeError}>
        <View style={styles.codeRow}>
          <Controller
            control={control}
            name="code"
            render={({ field }) => (
              <TextField
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                placeholder="A7F3-B2C1"
                autoCapitalize="characters"
                maxLength={9}
                style={styles.codeInput}
                accessibilityLabel="Código do parceiro"
              />
            )}
          />
          <Button
            title="Verificar"
            onPress={onLookup}
            loading={lookingUp}
            disabled={!codeComplete}
            size="md"
          />
        </View>
      </FormField>

      {foundPartner ? (
        <Card variant="subtle" style={styles.partnerCard}>
          <Avatar
            initials={getInitials(foundPartner.full_name, "??")}
            tone="partnerB"
          />
          <View style={styles.partnerInfo}>
            <AppText variant="bodySemibold" numberOfLines={1}>
              {foundPartner.full_name}
            </AppText>
            <Badge label="Código válido" tone="success" icon="check-circle" />
          </View>
          <Button
            title="Vincular"
            onPress={onLink}
            loading={linking}
            size="md"
          />
        </Card>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    letterSpacing: 2,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  partnerInfo: {
    flex: 1,
    gap: spacing.xs,
  },
});
