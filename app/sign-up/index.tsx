import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../../src/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C } from "../../src/theme/colors";
import { styles } from "./styles";

const REGISTRATION_STEP_KEY = "@registration_step";

export default function SignUp() {
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (user && !user.email_confirmed_at) {
      hasNavigated.current = true;
      router.replace("/verify-email");
    }
  }, [user]);

  useEffect(() => {
    AsyncStorage.setItem(REGISTRATION_STEP_KEY, "signup").catch(() => {});
  }, []);

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
    const { error: signUpError, session } = await signUp(email, password);
    setLoading(false);

    if (signUpError) {
      setError(signUpError);
      return;
    }

    if (!session) {
      router.replace({ pathname: "/verify-email", params: { email } });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: C.surface }}
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
