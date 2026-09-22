import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../../constants/storage";
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
} from "../onboarding-draft";

jest.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    __esModule: true,
    default: {
      multiGet: async (keys: string[]) =>
        keys.map(
          (key) => [key, store.get(key) ?? null] as [string, string | null],
        ),
      multiSet: async (pairs: [string, string][]) => {
        for (const [key, value] of pairs) store.set(key, value);
      },
      multiRemove: async (keys: string[]) => {
        for (const key of keys) store.delete(key);
      },
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      clear: async () => {
        store.clear();
      },
    },
  };
});

describe("onboarding draft", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("retorna vazio quando não há rascunho salvo", async () => {
    await expect(loadOnboardingDraft()).resolves.toEqual({});
  });

  it("salva e recupera os campos do rascunho", async () => {
    await saveOnboardingDraft({
      fullName: "Ana",
      birthDate: "10/02/1990",
      income: "R$ 1.234,56",
    });

    await expect(loadOnboardingDraft()).resolves.toEqual({
      fullName: "Ana",
      birthDate: "10/02/1990",
      income: "R$ 1.234,56",
    });
  });

  it("ignora chaves sem valor", async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.onboardingDraft.fullName, "Ana");
    await expect(loadOnboardingDraft()).resolves.toEqual({ fullName: "Ana" });
  });

  it("limpa todos os campos do rascunho", async () => {
    await saveOnboardingDraft({
      fullName: "Ana",
      birthDate: "10/02/1990",
      income: "1000",
    });

    await clearOnboardingDraft();

    await expect(loadOnboardingDraft()).resolves.toEqual({});
  });
});
