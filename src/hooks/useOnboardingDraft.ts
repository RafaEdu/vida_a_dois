import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearOnboardingDraft,
  loadOnboardingDraft,
  saveOnboardingDraft,
  type OnboardingDraft,
} from "../lib/onboarding-draft";

const SAVE_DEBOUNCE_MS = 500;

export function useOnboardingDraft() {
  const [draft, setDraft] = useState<Partial<OnboardingDraft>>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    loadOnboardingDraft()
      .then((stored) => {
        if (active) setDraft(stored);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );

  const persist = useCallback((value: OnboardingDraft) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveOnboardingDraft(value).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
  }, []);

  const clear = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    clearOnboardingDraft().catch(() => {});
  }, []);

  return { draft, loaded, persist, clear };
}
