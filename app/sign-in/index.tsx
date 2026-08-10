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
import { C } from "../../src/theme/colors";
import { styles } from "./styles";

export default function SignIn() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (user) {
      hasNavigated.current = true;
      if (!user.email_confirmed_at) {
        router.replace("/verify-email");
      } else {
        router.replace("/");
      }
    }
  }, [user]);

  const handleSignIn = async () => {
    setError("");
    if (!email.trim()) {
      setError("Insira seu e-mail.");
      return;
    }
    if (!password) {
      setError("Insira sua senha.");
      return;
    }

    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError(signInError);
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
            Assuma o controle financeiro do seu relacionamento
          </Text>
        </View>

        <View style={styles.form}>
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
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Sua senha"
              secureTextEntry
              autoComplete="current-password"
              placeholderTextColor="#999"
            />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </Pressable>

          <View style={styles.loginLink}>
            <Text style={styles.loginText}>Não tem uma conta? </Text>
            <Link href="/sign-up" style={styles.loginAction}>
              Criar conta
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
