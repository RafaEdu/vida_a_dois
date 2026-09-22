import { StyleSheet } from "react-native";
import { AppText, Button, Card } from "../../../components/ui";
import { spacing } from "../../../theme";
import { formatInviteCode } from "../model";

export interface InviteCodeCardProps {
  code: string | null | undefined;
  onCopy: () => void;
  copied: boolean;
  label?: string;
}

/** Displays the user's invite code with a copy action. */
export function InviteCodeCard({
  code,
  onCopy,
  copied,
  label = "Seu código de convite",
}: InviteCodeCardProps) {
  return (
    <Card padded padding="xl" style={styles.card}>
      <AppText variant="labelCaps" color="textSecondary" align="center">
        {label}
      </AppText>
      <AppText
        variant="display"
        tabular
        align="center"
        selectable
        style={styles.code}
      >
        {formatInviteCode(code)}
      </AppText>
      <Button
        variant="secondary"
        size="md"
        icon={copied ? "check" : "content-copy"}
        title={copied ? "Copiado!" : "Copiar código"}
        onPress={onCopy}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  code: {
    letterSpacing: 4,
  },
});
