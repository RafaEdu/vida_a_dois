import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useCouple } from "../../providers/CoupleProvider";
import {
  END_RELATIONSHIP_CONFIRMATION_PHRASE,
  isEndRelationshipConfirmationValid,
} from "./model";
import { colors, spacing } from "../../theme";
import { AppText, Button, Card, Screen } from "../../components/ui";
import { FormError, FormField, TextField } from "../../components/forms";

const CONSEQUENCES = [
  "O vínculo compartilhado será encerrado para as duas pessoas.",
  "Novos lançamentos compartilhados ficarão bloqueados.",
  "O histórico financeiro será preservado e continua consultável.",
  "Cada pessoa continuará com a própria conta.",
  "Cada pessoa poderá formar outro vínculo futuramente.",
];

function ConfirmCheckbox({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel="Li e entendi as consequências de encerrar o vínculo"
      style={({ pressed }) => [
        styles.checkboxRow,
        pressed ? styles.pressed : null,
      ]}
    >
      <MaterialIcons
        name={checked ? "check-box" : "check-box-outline-blank"}
        size={24}
        color={checked ? colors.primary : colors.textSecondary}
      />
      <AppText variant="bodySmall" style={styles.checkboxText}>
        Li e entendi que o vínculo será encerrado e que o histórico financeiro
        será preservado.
      </AppText>
    </Pressable>
  );
}

/**
 * Fluxo dedicado de encerramento do vínculo, em duas etapas: consequências e
 * confirmação forte (checkbox + digitação exata da frase). Não usa apenas um
 * "tem certeza?". O estado só muda após a confirmação do servidor.
 */
export function EndRelationshipScreen() {
  const { endRelationship } = useCouple();
  const [step, setStep] = useState<"consequences" | "confirm">("consequences");
  const [acknowledged, setAcknowledged] = useState(false);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const isValid = useMemo(
    () =>
      isEndRelationshipConfirmationValid({
        acknowledged,
        typedPhrase,
      }),
    [acknowledged, typedPhrase],
  );

  const handleConfirm = async () => {
    if (!isValid || submitting) return;

    setSubmitError("");
    setSubmitting(true);

    try {
      const { error } = await endRelationship();
      if (error) {
        setSubmitError(error);
        setSubmitting(false);
        return;
      }
      // Sucesso confirmado pelo servidor. O guard do grupo (app) leva o
      // usuário ao fluxo "sem parceiro" quando o bootstrap recalcular.
    } catch {
      setSubmitError("Erro inesperado ao encerrar o vínculo.");
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        scroll
        edges={["left", "right"]}
        contentContainerStyle={styles.content}
      >
        <AppText variant="labelCaps" color="textSecondary">
          {step === "consequences" ? "Etapa 1 de 2" : "Etapa 2 de 2"}
        </AppText>

        {step === "consequences" ? (
          <>
            <AppText variant="h2">Antes de continuar</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Encerrar o vínculo é uma ação permanente. Veja o que acontece:
            </AppText>

            <Card style={styles.card}>
              {CONSEQUENCES.map((item) => (
                <View key={item} style={styles.bullet}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={colors.primary}
                  />
                  <AppText variant="bodySmall" style={styles.bulletText}>
                    {item}
                  </AppText>
                </View>
              ))}
            </Card>

            <View style={styles.actions}>
              <Button
                title="Continuar"
                iconRight="arrow-forward"
                fullWidth
                onPress={() => setStep("confirm")}
              />
              <Button
                title="Cancelar"
                variant="secondary"
                fullWidth
                onPress={() => router.back()}
              />
            </View>
          </>
        ) : (
          <>
            <AppText variant="h2">Confirmar encerramento</AppText>
            <AppText variant="bodySmall" color="textSecondary">
              Esta ação encerra o vínculo para as duas pessoas e não pode ser
              desfeita.
            </AppText>

            <FormError message={submitError} />

            <Card style={styles.card}>
              <ConfirmCheckbox
                checked={acknowledged}
                onToggle={() => setAcknowledged((value) => !value)}
              />

              <View style={styles.separator} />

              <FormField
                label="Digite a frase para confirmar"
                hint={`Digite exatamente: ${END_RELATIONSHIP_CONFIRMATION_PHRASE}`}
              >
                <TextField
                  value={typedPhrase}
                  onChangeText={setTypedPhrase}
                  placeholder={END_RELATIONSHIP_CONFIRMATION_PHRASE}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  invalid={typedPhrase.length > 0 && !isValid}
                  accessibilityLabel="Digite a frase de confirmação"
                />
              </FormField>
            </Card>

            <View style={styles.actions}>
              <Button
                title={submitting ? "Encerrando..." : "Encerrar vínculo"}
                variant="danger"
                icon="link-off"
                fullWidth
                loading={submitting}
                disabled={!isValid}
                onPress={handleConfirm}
                accessibilityLabel="Confirmar encerramento do vínculo"
              />
              <Button
                title="Voltar"
                variant="secondary"
                fullWidth
                disabled={submitting}
                onPress={() => setStep("consequences")}
              />
            </View>
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    gap: spacing.md,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  bulletText: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    minHeight: 44,
  },
  checkboxText: {
    flex: 1,
    paddingTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
