import { useEffect, useRef, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { FormError } from "../../components/forms";
import { AppText, Button } from "../../components/ui";
import { colors, fontFamilies, radius, spacing } from "../../theme";
import { AuthLayout } from "./components";

const OTP_LENGTH = 6;

export function VerifyEmailScreen() {
  const { user, verifyOtp, resendVerification } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = user?.email ?? params.email ?? "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;

    if (!user && !params.email) {
      hasNavigated.current = true;
      router.replace("/sign-in");
    }
  }, [user, params.email]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (otp: string) => {
    if (!email) return;
    setError("");
    setLoading(true);
    const { error: verifyError } = await verifyOtp(email, otp);
    setLoading(false);
    if (verifyError) {
      setError("Código inválido ou expirado. Tente novamente.");
      setCode(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  const handleInput = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "");
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setError("");
    const { error: resendError } = await resendVerification(email);
    if (resendError) {
      setError(resendError);
    } else {
      setCooldown(60);
    }
  };

  return (
    <AuthLayout
      title="Verifique seu e-mail"
      subtitle={`Enviamos um código para ${email || "seu e-mail"}. Verifique sua caixa de entrada.`}
    >
      <AppText variant="labelCaps" color="primary">
        Etapa 1b de 2
      </AppText>

      <FormError message={error} />

      <View style={styles.codeRow}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => {
              inputs.current[i] = ref;
            }}
            style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
            value={digit}
            onChangeText={(text) => handleInput(text, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            accessibilityLabel={`Dígito ${i + 1}`}
          />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          variant="ghost"
          size="md"
          title={
            cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"
          }
          onPress={handleResend}
          disabled={cooldown > 0}
          textStyle={styles.resendText}
        />
        {loading ? (
          <AppText variant="bodySmall" color="textSecondary" align="center">
            Verificando...
          </AppText>
        ) : null}
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  codeRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  codeInput: {
    flex: 1,
    height: 56,
    minHeight: 0,
    paddingHorizontal: 0,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    textAlign: "center",
    fontFamily: fontFamilies.jakarta.semibold,
    fontSize: 22,
    color: colors.text,
  },
  codeInputFilled: {
    borderColor: colors.primary,
  },
  actions: {
    alignItems: "center",
    gap: spacing.sm,
  },
  resendText: {
    color: colors.primary,
  },
});
