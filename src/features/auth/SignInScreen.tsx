import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import {
  signInFormSchema,
  type SignInFormInput,
  type SignInFormValues,
} from "../../domain/account/schemas";
import { FormError, FormField, TextField } from "../../components/forms";
import { Button } from "../../components/ui";
import { AuthFooterLink, AuthLayout } from "./components";

export function SignInScreen() {
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
    <AuthLayout
      title="Vida a Dois"
      subtitle="Assuma o controle financeiro do seu relacionamento"
    >
      <FormError message={submitError} />

      <FormField label="E-mail" error={errors.email?.message}>
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
              placeholder="Sua senha"
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              invalid={Boolean(errors.password)}
              onSubmitEditing={handleSubmit(onSubmit)}
            />
          )}
        />
      </FormField>

      <Button
        title={isSubmitting ? "Entrando..." : "Entrar"}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        fullWidth
      />

      <AuthFooterLink
        text="Não tem uma conta?"
        actionLabel="Criar conta"
        href="/sign-up"
      />
    </AuthLayout>
  );
}
