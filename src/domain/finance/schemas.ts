import { z } from "zod";
import { parseDecimalInput } from "../../utils/currency";
import { isValidDateOnly } from "../../utils/date";

const requiredAmount = z
  .string()
  .transform((value) => parseDecimalInput(value))
  .refine((value) => value > 0, "Informe um valor válido.");

const optionalDateOnly = z
  .string()
  .refine(
    (value) => value === "" || isValidDateOnly(value),
    "Data inválida. Use o formato AAAA-MM-DD.",
  );

export const expenseFormSchema = z
  .object({
    description: z.string().trim().min(1, "Informe a descrição da despesa."),
    amount: requiredAmount,
    category: z.string().min(1, "Selecione uma categoria."),
    dueDate: optionalDateOnly,
    paidBy: z.string(),
    isRecurring: z.boolean(),
    paid: z.boolean(),
  })
  .refine((data) => !data.isRecurring || data.dueDate !== "", {
    message: "Despesa recorrente precisa de uma data de vencimento.",
    path: ["dueDate"],
  })
  .refine((data) => !data.paid || data.paidBy.length > 0, {
    message: "Selecione quem pagou.",
    path: ["paidBy"],
  });

export type ExpenseFormInput = z.input<typeof expenseFormSchema>;
export type ExpenseFormValues = z.output<typeof expenseFormSchema>;

export const expenseEditFormSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição."),
  amount: requiredAmount,
  category: z.string().min(1, "Selecione uma categoria."),
});

export type ExpenseEditFormInput = z.input<typeof expenseEditFormSchema>;
export type ExpenseEditFormValues = z.output<typeof expenseEditFormSchema>;

export const incomeFormSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição da receita."),
  amount: requiredAmount,
  receivedDate: optionalDateOnly,
  isExtra: z.boolean(),
});

export type IncomeFormInput = z.input<typeof incomeFormSchema>;
export type IncomeFormValues = z.output<typeof incomeFormSchema>;

export const incomeEditFormSchema = z.object({
  description: z.string().trim().min(1, "Informe a descrição."),
  amount: requiredAmount,
});

export type IncomeEditFormInput = z.input<typeof incomeEditFormSchema>;
export type IncomeEditFormValues = z.output<typeof incomeEditFormSchema>;

const percent = z
  .string()
  .transform((value) => parseFloat(value) || 0)
  .refine(
    (value) => value >= 0 && value <= 100,
    "A porcentagem deve estar entre 0 e 100.",
  );

export const costPlanFormSchema = z
  .object({
    budget: z
      .string()
      .transform((value) => parseDecimalInput(value))
      .refine((value) => value > 0, "Informe um orçamento válido."),
    splitMode: z.enum(["manual", "income_based"]),
    selfSplit: percent,
    partnerSplit: percent,
  })
  .refine(
    (data) =>
      data.splitMode !== "manual" ||
      Math.abs(data.selfSplit + data.partnerSplit - 100) < 0.01,
    {
      message: "A soma das porcentagens deve ser 100%.",
      path: ["partnerSplit"],
    },
  );

export type CostPlanFormInput = z.input<typeof costPlanFormSchema>;
export type CostPlanFormValues = z.output<typeof costPlanFormSchema>;
