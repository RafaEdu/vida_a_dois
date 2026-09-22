import { StyleSheet, View } from "react-native";
import { FormError } from "../../../components/forms";
import { Button } from "../../../components/ui";
import { spacing } from "../../../theme";
import { InviteCodeCard } from "./InviteCodeCard";
import { OnboardingHeader } from "./OnboardingHeader";
import { PartnerConnection } from "./PartnerConnection";

export interface LinkPendingViewProps {
  isReceiver: boolean;
  selfInitials: string;
  partnerInitials: string;
  partnerName?: string;
  inviteCode: string | null | undefined;
  copied: boolean;
  onCopy: () => void;
  accepting: boolean;
  rejecting: boolean;
  onAccept: () => void;
  onReject: () => void;
  submitError: string;
}

/** Pending link: either a received invite or a sent invite awaiting a reply. */
export function LinkPendingView({
  isReceiver,
  selfInitials,
  partnerInitials,
  partnerName,
  inviteCode,
  copied,
  onCopy,
  accepting,
  rejecting,
  onAccept,
  onReject,
  submitError,
}: LinkPendingViewProps) {
  if (isReceiver) {
    return (
      <>
        <OnboardingHeader
          title="Convite recebido"
          subtitle={`${partnerName ?? "Alguém"} quer começar uma vida a dois com você`}
        />

        <PartnerConnection
          left={{ initials: partnerInitials, tone: "partnerB" }}
          right={{
            initials: selfInitials,
            tone: "partnerA",
            label: "Você",
            labelTone: "primary",
          }}
          accessibilityLabel="Convite de vínculo recebido"
        />

        <FormError message={submitError} />

        <View style={styles.actionRow}>
          <Button
            variant="secondary"
            title="Recusar"
            onPress={onReject}
            loading={rejecting}
            disabled={accepting || rejecting}
            style={styles.actionButton}
          />
          <Button
            title="Aceitar"
            onPress={onAccept}
            loading={accepting}
            disabled={accepting || rejecting}
            style={styles.actionButton}
          />
        </View>

        <InviteCodeCard
          code={inviteCode}
          onCopy={onCopy}
          copied={copied}
          label="Seu código"
        />
      </>
    );
  }

  return (
    <>
      <OnboardingHeader
        title="Aguardando parceiro"
        subtitle={
          partnerName
            ? `Aguardando ${partnerName} aceitar o convite`
            : undefined
        }
      />

      <PartnerConnection
        left={{ initials: selfInitials, tone: "partnerA" }}
        right={{
          initials: partnerInitials,
          tone: "partnerB",
          label: "Pendente",
          labelTone: "warning",
        }}
        accessibilityLabel="Convite enviado, aguardando confirmação"
      />

      <InviteCodeCard code={inviteCode} onCopy={onCopy} copied={copied} />
    </>
  );
}

const styles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
