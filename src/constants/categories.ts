export type CategoryType = "Fixo" | "Variável";

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  type: CategoryType;
}

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  {
    id: "rent",
    name: "Aluguel / Financiamento",
    icon: "\u{1F3E0}",
    type: "Fixo",
  },
  { id: "condo", name: "Condomínio", icon: "\u{1F3E2}", type: "Fixo" },
  { id: "water", name: "Água", icon: "\u{1F4A7}", type: "Variável" },
  {
    id: "electricity",
    name: "Energia elétrica",
    icon: "\u{26A1}",
    type: "Variável",
  },
  { id: "gas", name: "Gás", icon: "\u{1F525}", type: "Variável" },
  { id: "internet", name: "Internet", icon: "\u{1F4E1}", type: "Fixo" },
  {
    id: "groceries",
    name: "Alimentação (mercado)",
    icon: "\u{1F6D2}",
    type: "Variável",
  },
  {
    id: "restaurants",
    name: "Alimentação (restaurantes)",
    icon: "\u{1F37D}\uFE0F",
    type: "Variável",
  },
  {
    id: "fuel",
    name: "Transporte (combustível)",
    icon: "\u{26FD}",
    type: "Variável",
  },
  {
    id: "transport",
    name: "Transporte (público / app)",
    icon: "\u{1F68C}",
    type: "Variável",
  },
  {
    id: "health",
    name: "Saúde e farmácia",
    icon: "\u{1F48A}",
    type: "Variável",
  },
  {
    id: "health_plan",
    name: "Plano de saúde",
    icon: "\u{1F3E5}",
    type: "Fixo",
  },
  {
    id: "subscriptions",
    name: "Streaming e assinaturas",
    icon: "\u{1F4FA}",
    type: "Fixo",
  },
  {
    id: "leisure",
    name: "Lazer e entretenimento",
    icon: "\u{1F389}",
    type: "Variável",
  },
  { id: "clothing", name: "Vestuário", icon: "\u{1F455}", type: "Variável" },
  { id: "education", name: "Educação", icon: "\u{1F4DA}", type: "Fixo" },
  { id: "pets", name: "Pets", icon: "\u{1F43E}", type: "Variável" },
  { id: "other", name: "Outros", icon: "\u{1F4E6}", type: "Variável" },
];
