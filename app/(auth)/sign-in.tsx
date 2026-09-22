import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/lib/auth-context";
import {
  signInFormSchema,
  type SignInFormInput,
  type SignInFormValues,
} from "../../src/domain/account/schemas";
import {
  FormError,
  FormField,
  PrimaryButton,
} from "../../src/components/forms";
import { C } from "../../src/theme/colors";
import { styles } from "../../src/styles/sign-in";

export default function SignIn() {
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormInput, unknown, SignInFormValues>({
    resolver: zodResolver(signInFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setSubmitError("");
    const { error: signInError } = await signIn(values.email, values.password);
    if (signInError) {
      setSubmitError(signInError);
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
          <FormError message={submitError} variant="plain" />

          <FormField
            label="E-mail"
            error={errors.email?.message}
            labelStyle={styles.label}
          >
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholderTextColor="#999"
                />
              )}
            />
          </FormField>

          <FormField
            label="Senha"
            error={errors.password?.message}
            labelStyle={styles.label}
          >
            <Controller
              control={control}
              name="password"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Sua senha"
                  secureTextEntry
                  autoComplete="current-password"
                  placeholderTextColor="#999"
                />
              )}
            />
          </FormField>

          <PrimaryButton
            title={isSubmitting ? "Entrando..." : "Entrar"}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.button}
            textStyle={styles.buttonText}
            disabledStyle={styles.buttonDisabled}
            pressedStyle={styles.buttonPressed}
          />

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
