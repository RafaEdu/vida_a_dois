import { useState } from "react";
import { router } from "expo-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import {
  signUpFormSchema,
  type SignUpFormInput,
  type SignUpFormValues,
} from "../../domain/account/schemas";
import {
  FormError,
  FormField,
  PrimaryButton,
  TextField,
} from "../../components/forms";
import { AppText } from "../../components/ui";
import { AuthFooterLink, AuthLayout } from "./components";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignUpScreen() {
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
    <AuthLayout
      title="Vida a Dois"
      subtitle="Planejem a vida financeira de vocês juntos"
    >
      <AppText variant="labelCaps" color="primary">
        Etapa 1 de 2
      </AppText>

      <FormError message={submitError} />

      <FormField
        label="E-mail"
        error={errors.email?.message}
        hint={
          email.length > 0 && !isEmailValid
            ? "Insira um e-mail válido"
            : undefined
        }
      >
        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              invalid={Boolean(errors.email)}
            />
          )}
        />
      </FormField>

      <FormField label="Senha" error={errors.password?.message}>
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Mínimo de 8 caracteres"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="next"
              invalid={Boolean(errors.password)}
            />
          )}
        />
      </FormField>

      <FormField
        label="Confirmar senha"
        error={errors.confirmPassword?.message}
        hint={
          confirmPassword.length > 0 && !passwordsMatch
            ? "As senhas não conferem"
            : undefined
        }
      >
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              placeholder="Repita a senha"
              secureTextEntry
              autoComplete="new-password"
              returnKeyType="done"
              invalid={Boolean(errors.confirmPassword)}
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </FormField>

      <PrimaryButton
        title={isSubmitting ? "Criando conta..." : "Criar conta"}
        onPress={handleSubmit(onSubmit)}
        disabled={!isFormValid}
        loading={isSubmitting}
      />

      <AuthFooterLink
        text="Já tem uma conta?"
        actionLabel="Entrar"
        href="/sign-in"
      />
    </AuthLayout>
  );
}
