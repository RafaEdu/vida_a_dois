import { useState, useEffect } from "react";
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
import { Link, router } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

export default function SignUp() {
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !user.email_confirmed_at) {
      router.replace("/verify-email");
    }
  }, [user]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;

  const handleSignUp = async () => {
    setError("");
    if (!isEmailValid) {
      setError("Insira um e-mail válido.");
      return;
    }
    if (!isPasswordValid) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!passwordsMatch) {
      setError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(email, password);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
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
          <Text style={styles.title}>Vida a Dois</Text>
          <Text style={styles.subtitle}>
            Planejem a vida financeira de vocês juntos
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.step}>Etapa 1 de 2</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} selectable>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholderTextColor="#999"
            />
            {email.length > 0 && !isEmailValid && (
              <Text style={styles.hint}>Insira um e-mail válido</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo de 8 caracteres"
              secureTextEntry
              autoComplete="new-password"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Confirmar senha</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repita a senha"
              secureTextEntry
              autoComplete="new-password"
              placeholderTextColor="#999"
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.hint}>As senhas não conferem</Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              (!isEmailValid || !isPasswordValid || !passwordsMatch || loading) &&
                styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSignUp}
            disabled={!isEmailValid || !isPasswordValid || !passwordsMatch || loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Criando conta..." : "Criar conta"}
            </Text>
          </Pressable>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Já tem uma conta? </Text>
            <Link href="/sign-in" style={styles.loginAction}>
              Entrar
            </Link>
          </View>
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
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  step: {
    fontSize: 13,
    color: "#FF6B6B",
    fontWeight: "600",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A1A",
  },
  hint: {
    fontSize: 12,
    color: "#FF6B6B",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  buttonDisabled: {
    backgroundColor: "#FFB3B3",
    boxShadow: "none",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginAction: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
});
