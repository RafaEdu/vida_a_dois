import { describe, expect, it } from "@jest/globals";
import {
  costPlanFormSchema,
  expenseEditFormSchema,
  expenseFormSchema,
  incomeEditFormSchema,
  incomeFormSchema,
} from "../schemas";

describe("expenseFormSchema", () => {
  const base = {
    description: "Supermercado",
    amount: "150,50",
    category: "Alimentação (mercado)",
    dueDate: "2026-09-10",
    paidBy: "user-1",
    isRecurring: false,
    paid: false,
  };

  it("parseia valor decimal e trim da descrição", () => {
    const result = expenseFormSchema.parse({
      ...base,
      description: "  Supermercado  ",
    });
    expect(result.description).toBe("Supermercado");
    expect(result.amount).toBe(150.5);
  });

  it("rejeita descrição vazia", () => {
    const result = expenseFormSchema.safeParse({ ...base, description: "   " });
    expect(result.success).toBe(false);
  });

  it("rejeita valor zero ou inválido", () => {
    expect(expenseFormSchema.safeParse({ ...base, amount: "0" }).success).toBe(
      false,
    );
    expect(
      expenseFormSchema.safeParse({ ...base, amount: "abc" }).success,
    ).toBe(false);
  });

  it("rejeita data de vencimento inválida", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      dueDate: "2026-02-30",
    });
    expect(result.success).toBe(false);
  });

  it("aceita data vazia quando não recorrente", () => {
    expect(expenseFormSchema.safeParse({ ...base, dueDate: "" }).success).toBe(
      true,
    );
  });

  it("exige vencimento quando recorrente", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      isRecurring: true,
      dueDate: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["dueDate"]);
    }
  });

  it("não exige pagador em despesa pendente", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      paid: false,
      paidBy: "",
    });
    expect(result.success).toBe(true);
  });

  it("exige pagador em despesa paga", () => {
    const result = expenseFormSchema.safeParse({
      ...base,
      paid: true,
      paidBy: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["paidBy"]);
    }
  });

  it("aceita despesa paga com pagador", () => {
    expect(
      expenseFormSchema.safeParse({ ...base, paid: true, paidBy: "user-1" })
        .success,
    ).toBe(true);
  });
});

describe("incomeFormSchema", () => {
  const base = {
    description: "Freelance",
    amount: "1.234,56",
    receivedDate: "",
    isExtra: true,
  };

  it("parseia separador de milhar", () => {
    expect(incomeFormSchema.parse(base).amount).toBe(1234.56);
  });

  it("rejeita data inválida", () => {
    expect(
      incomeFormSchema.safeParse({ ...base, receivedDate: "10/09/2026" })
        .success,
    ).toBe(false);
  });
});

describe("edit schemas", () => {
  it("expenseEditFormSchema valida descrição e valor", () => {
    expect(
      expenseEditFormSchema.safeParse({
        description: "",
        amount: "10",
        category: "Outros",
      }).success,
    ).toBe(false);
    expect(
      expenseEditFormSchema.safeParse({
        description: "Luz",
        amount: "10",
        category: "Outros",
      }).success,
    ).toBe(true);
  });

  it("incomeEditFormSchema valida valor", () => {
    expect(
      incomeEditFormSchema.safeParse({ description: "Bônus", amount: "0" })
        .success,
    ).toBe(false);
  });
});

describe("costPlanFormSchema", () => {
  it("aceita orçamento e divisão válidos", () => {
    const result = costPlanFormSchema.parse({
      budget: "5.000,00",
      splitA: "60",
    });
    expect(result).toEqual({ budget: 5000, splitA: 60 });
  });

  it("rejeita orçamento zero", () => {
    expect(
      costPlanFormSchema.safeParse({ budget: "0", splitA: "50" }).success,
    ).toBe(false);
  });

  it("rejeita divisão fora de 0..100", () => {
    expect(
      costPlanFormSchema.safeParse({ budget: "1000", splitA: "120" }).success,
    ).toBe(false);
    expect(
      costPlanFormSchema.safeParse({ budget: "1000", splitA: "" }).success,
    ).toBe(true);
  });
});
