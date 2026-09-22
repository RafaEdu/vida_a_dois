import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/lib/auth-context";
import {
  signUpFormSchema,
  type SignUpFormInput,
  type SignUpFormValues,
} from "../../src/domain/account/schemas";
import {
  FormError,
  FormField,
  PrimaryButton,
} from "../../src/components/forms";
import { C } from "../../src/theme/colors";
import { styles } from "../../src/styles/sign-up";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
  const { signUp } = useAuth();
  const [submitError, setSubmitError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormInput, unknown, SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const email = useWatch({ control, name: "email" }) ?? "";
  const password = useWatch({ control, name: "password" }) ?? "";
  const confirmPassword = useWatch({ control, name: "confirmPassword" }) ?? "";

  const isEmailValid = EMAIL_PATTERN.test(email);
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword;
  const isFormValid = isEmailValid && isPasswordValid && passwordsMatch;

  const onSubmit = async (values: SignUpFormValues) => {
    setSubmitError("");
    const { error: signUpError, session } = await signUp(
      values.email,
      values.password,
    );

    if (signUpError) {
      setSubmitError(signUpError);
      return;
    }

    if (!session) {
      router.replace({
        pathname: "/verify-email",
        params: { email: values.email },
      });
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
            {email.length > 0 && !isEmailValid && (
              <Text style={styles.hint}>Insira um e-mail válido</Text>
            )}
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
                  placeholder="Mínimo de 8 caracteres"
                  secureTextEntry
                  autoComplete="new-password"
                  placeholderTextColor="#999"
                />
              )}
            />
          </FormField>

          <FormField
            label="Confirmar senha"
            error={errors.confirmPassword?.message}
            labelStyle={styles.label}
          >
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Repita a senha"
                  secureTextEntry
                  autoComplete="new-password"
                  placeholderTextColor="#999"
                />
              )}
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <Text style={styles.hint}>As senhas não conferem</Text>
            )}
          </FormField>

          <PrimaryButton
            title={isSubmitting ? "Criando conta..." : "Criar conta"}
            onPress={handleSubmit(onSubmit)}
            disabled={!isFormValid}
            loading={isSubmitting}
            style={styles.button}
            textStyle={styles.buttonText}
            disabledStyle={styles.buttonDisabled}
            pressedStyle={styles.buttonPressed}
          />

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
