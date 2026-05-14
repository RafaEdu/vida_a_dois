import { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

export default function VerifyEmail() {
  const { user, verifyOtp, resendVerification } = useAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const email = user?.email ?? params.email ?? "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!user && !params.email) {
      router.replace("/sign-in");
    } else if (user?.email_confirmed_at) {
      router.replace("/");
    }
  }, [user, params.email]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleInput = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "");
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FAFAFA" }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Verifique seu e-mail</Text>
          <Text style={styles.subtitle} selectable>
            Enviamos um código para {email || "seu e-mail"}. Verifique sua caixa de
            entrada.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.step}>Etapa 1b de 2</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} selectable>{error}</Text>
            </View>
          ) : null}

          <View style={styles.codeRow}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => { inputs.current[i] = ref; }}
                style={[styles.codeInput, digit && styles.codeInputFilled]}
                value={digit}
                onChangeText={(text) => handleInput(text, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.resendButton,
              cooldown > 0 && styles.resendButtonDisabled,
              pressed && styles.resendButtonPressed,
            ]}
            onPress={handleResend}
            disabled={cooldown > 0}
          >
            <Text style={styles.resendText}>
              {cooldown > 0
                ? `Reenviar código (${cooldown}s)`
                : "Reenviar código"}
            </Text>
          </Pressable>

          {loading && (
            <Text style={styles.verifying}>Verificando...</Text>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
    alignItems: "center",
  },
  step: {
    fontSize: 13,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 32,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
    width: "100%",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
    textAlign: "center",
  },
  codeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFF",
    textAlign: "center",
    fontSize: 24,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  codeInputFilled: {
    borderColor: "#FF6B6B",
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  resendButtonDisabled: {
    opacity: 0.5,
  },
  resendButtonPressed: {
    opacity: 0.7,
  },
  resendText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  verifying: {
    fontSize: 14,
    color: "#999",
    marginTop: 16,
  },
});
