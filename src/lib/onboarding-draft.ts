import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../constants/storage";

export interface OnboardingDraft {
  fullName: string;
  birthDate: string;
  income: string;
}

const DRAFT_KEYS = [
  STORAGE_KEYS.onboardingDraft.fullName,
  STORAGE_KEYS.onboardingDraft.birthDate,
  STORAGE_KEYS.onboardingDraft.income,
];

export async function loadOnboardingDraft(): Promise<Partial<OnboardingDraft>> {
  const values = await AsyncStorage.multiGet(DRAFT_KEYS);

  const draft: Partial<OnboardingDraft> = {};
  for (const [key, value] of values) {
    if (!value) continue;
    if (key === STORAGE_KEYS.onboardingDraft.fullName) draft.fullName = value;
    if (key === STORAGE_KEYS.onboardingDraft.birthDate) draft.birthDate = value;
    if (key === STORAGE_KEYS.onboardingDraft.income) draft.income = value;
  }

  return draft;
}

export async function saveOnboardingDraft(
  draft: OnboardingDraft,
): Promise<void> {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.onboardingDraft.fullName, draft.fullName],
    [STORAGE_KEYS.onboardingDraft.birthDate, draft.birthDate],
    [STORAGE_KEYS.onboardingDraft.income, draft.income],
  ]);
}

export async function clearOnboardingDraft(): Promise<void> {
  await AsyncStorage.multiRemove(DRAFT_KEYS);
}
