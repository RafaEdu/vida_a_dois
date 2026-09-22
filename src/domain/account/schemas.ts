import { z } from "zod";
import { parseCurrencyInput } from "../../utils/currency";
import { parseBirthDateToISO } from "../../utils/date";

export const signInFormSchema = z.object({
  email: z.string().trim().min(1, "Insira seu e-mail."),
  password: z.string().min(1, "Insira sua senha."),
});

export type SignInFormInput = z.input<typeof signInFormSchema>;
export type SignInFormValues = z.output<typeof signInFormSchema>;

export const signUpFormSchema = z
  .object({
    email: z
      .string()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Insira um e-mail válido."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type SignUpFormInput = z.input<typeof signUpFormSchema>;
export type SignUpFormValues = z.output<typeof signUpFormSchema>;

export const profileSetupFormSchema = z.object({
  fullName: z.string().trim().min(1, "Informe seu nome completo."),
  birthDate: z
    .string()
    .refine(
      (value) => parseBirthDateToISO(value) !== null,
      "Informe uma data de nascimento válida (DD/MM/AAAA).",
    ),
  income: z.string(),
});

export type ProfileSetupFormInput = z.input<typeof profileSetupFormSchema>;
export type ProfileSetupFormValues = z.output<typeof profileSetupFormSchema>;

export const profileEditFormSchema = z.object({
  fullName: z.string().trim().min(1, "Informe seu nome."),
  birthDate: z
    .string()
    .refine(
      (value) => parseBirthDateToISO(value) !== null,
      "Informe uma data de nascimento válida (DD/MM/AAAA).",
    ),
  income: z.string(),
});

export type ProfileEditFormInput = z.input<typeof profileEditFormSchema>;
export type ProfileEditFormValues = z.output<typeof profileEditFormSchema>;

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Insira sua senha atual."),
    newPassword: z
      .string()
      .min(8, "A nova senha deve ter pelo menos 8 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormInput = z.input<typeof changePasswordFormSchema>;
export type ChangePasswordFormValues = z.output<
  typeof changePasswordFormSchema
>;

export interface ProfileUpdateInput {
  full_name: string;
  birth_date: string;
  monthly_income: number | null;
}

/**
 * Converte os valores do formulário de perfil para o payload aceito pela
 * camada de dados. Renda vazia é enviada como `null` e a data de nascimento
 * (DD/MM/AAAA) é normalizada para ISO, com a mesma validação do onboarding.
 */
export function toProfileUpdateInput(
  values: ProfileEditFormValues,
): ProfileUpdateInput {
  return {
    full_name: values.fullName,
    birth_date: parseBirthDateToISO(values.birthDate) ?? "",
    monthly_income: values.income ? parseCurrencyInput(values.income) : null,
  };
}

export const partnerCodeFormSchema = z.object({
  code: z
    .string()
    .transform((value) => value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())
    .refine((value) => value.length === 8, "O código deve ter 8 caracteres."),
});

export type PartnerCodeFormInput = z.input<typeof partnerCodeFormSchema>;
export type PartnerCodeFormValues = z.output<typeof partnerCodeFormSchema>;
