import { StyleSheet, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Badge, Button } from "../../../components/ui";
import { colors, spacing } from "../../../theme";
import { OnboardingHeader } from "./OnboardingHeader";
import { PartnerConnection } from "./PartnerConnection";

export interface LinkActiveViewProps {
  selfInitials: string;
  partnerInitials: string;
  confirmed: boolean;
  onStart: () => void;
}

/** Link confirmed: both partners are connected. */
export function LinkActiveView({
  selfInitials,
  partnerInitials,
  confirmed,
  onStart,
}: LinkActiveViewProps) {
  return (
    <>
      <OnboardingHeader
        title={confirmed ? "Vinculado com sucesso!" : "Vínculo confirmado"}
        subtitle={
          confirmed
            ? "Redirecionando para o planejamento financeiro..."
            : "Agora vamos configurar a vida financeira de vocês juntos"
        }
      />

      <PartnerConnection
        connected
        left={{ initials: selfInitials, tone: "partnerA" }}
        right={{ initials: partnerInitials, tone: "partnerB" }}
        accessibilityLabel="Parceiros vinculados"
      />

      <View style={styles.centered}>
        <Badge label="Vinculados" tone="success" icon="check-circle" />
      </View>

      <View style={styles.centered}>
        <MaterialIcons name="check-circle" size={48} color={colors.success} />
      </View>

      <Button
        title="Começar planejamento"
        icon="arrow-forward"
        onPress={onStart}
      />
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    gap: spacing.sm,
  },
});
