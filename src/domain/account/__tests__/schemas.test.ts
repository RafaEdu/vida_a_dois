import { describe, expect, it } from "@jest/globals";
import {
  changePasswordFormSchema,
  partnerCodeFormSchema,
  profileEditFormSchema,
  profileSetupFormSchema,
  signInFormSchema,
  signUpFormSchema,
  toProfileUpdateInput,
} from "../schemas";

describe("signInFormSchema", () => {
  it("exige e-mail e senha", () => {
    expect(
      signInFormSchema.safeParse({ email: "  ", password: "" }).success,
    ).toBe(false);
    expect(
      signInFormSchema.parse({ email: "  a@b.com ", password: "x" }).email,
    ).toBe("a@b.com");
  });
});

describe("signUpFormSchema", () => {
  const base = {
    email: "a@b.com",
    password: "12345678",
    confirmPassword: "12345678",
  };

  it("aceita dados válidos", () => {
    expect(signUpFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita e-mail inválido", () => {
    expect(
      signUpFormSchema.safeParse({ ...base, email: "invalido" }).success,
    ).toBe(false);
  });

  it("rejeita senha curta", () => {
    expect(
      signUpFormSchema.safeParse({
        ...base,
        password: "123",
        confirmPassword: "123",
      }).success,
    ).toBe(false);
  });

  it("rejeita senhas diferentes", () => {
    const result = signUpFormSchema.safeParse({
      ...base,
      confirmPassword: "outra",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});

describe("profileSetupFormSchema", () => {
  it("aceita data BR válida", () => {
    expect(
      profileSetupFormSchema.parse({
        fullName: " Maria ",
        birthDate: "01/02/1990",
        income: "R$ 1.000,00",
      }).fullName,
    ).toBe("Maria");
  });

  it("rejeita data inválida", () => {
    expect(
      profileSetupFormSchema.safeParse({
        fullName: "Maria",
        birthDate: "31/02/1990",
        income: "",
      }).success,
    ).toBe(false);
  });
});

describe("profileEditFormSchema", () => {
  it("exige nome", () => {
    expect(
      profileEditFormSchema.safeParse({
        fullName: " ",
        birthDate: "01/02/1990",
        income: "",
      }).success,
    ).toBe(false);
  });

  it("rejeita data de nascimento inválida com a mesma regra do onboarding", () => {
    expect(
      profileEditFormSchema.safeParse({
        fullName: "Maria",
        birthDate: "31/02/1990",
        income: "",
      }).success,
    ).toBe(false);
  });
});

describe("toProfileUpdateInput", () => {
  it("converte a renda formatada e a data para ISO", () => {
    expect(
      toProfileUpdateInput({
        fullName: "Rafael",
        birthDate: "01/02/1990",
        income: "R$ 1.234,56",
      }),
    ).toEqual({
      full_name: "Rafael",
      birth_date: "1990-02-01",
      monthly_income: 1234.56,
    });
  });

  it("envia renda nula quando o campo está vazio", () => {
    expect(
      toProfileUpdateInput({
        fullName: "Rafael",
        birthDate: "01/02/1990",
        income: "",
      }),
    ).toEqual({
      full_name: "Rafael",
      birth_date: "1990-02-01",
      monthly_income: null,
    });
  });
});

describe("changePasswordFormSchema", () => {
  const base = {
    currentPassword: "senha-antiga",
    newPassword: "senha-nova-1",
    confirmPassword: "senha-nova-1",
  };

  it("aceita dados válidos", () => {
    expect(changePasswordFormSchema.safeParse(base).success).toBe(true);
  });

  it("rejeita senha nova curta", () => {
    expect(
      changePasswordFormSchema.safeParse({
        ...base,
        newPassword: "123",
        confirmPassword: "123",
      }).success,
    ).toBe(false);
  });

  it("rejeita confirmação diferente", () => {
    const result = changePasswordFormSchema.safeParse({
      ...base,
      confirmPassword: "outra",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["confirmPassword"]);
    }
  });
});

describe("partnerCodeFormSchema", () => {
  it("normaliza o código", () => {
    expect(partnerCodeFormSchema.parse({ code: "a7f3-b2c1" }).code).toBe(
      "A7F3B2C1",
    );
  });

  it("rejeita código com tamanho incorreto", () => {
    expect(partnerCodeFormSchema.safeParse({ code: "A7F3" }).success).toBe(
      false,
    );
  });
});
