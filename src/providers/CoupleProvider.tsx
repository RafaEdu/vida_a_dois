import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { useAuthSession } from "./AuthProvider";
import { deriveCoupleLoadStatus, type LoadStatus } from "./bootstrap";
import { deriveUserState } from "../lib/user-state";
import * as profileService from "../services/profile";
import * as coupleService from "../services/couple";
import type { CostPlanInput } from "../services/couple";
import type { ProfileUpdateInput } from "../domain/account/schemas";
import {
  buildAvatarObjectPath,
  decodeAvatarBase64,
  validateAvatarAsset,
  type AvatarPickerAsset,
} from "../domain/account/avatar";
import {
  subscribeToCoupleChanges,
  subscribeToCoupleInvites,
} from "../services/realtime";
import { ok, type ServiceResult } from "../utils/result";
import type {
  Couple,
  IdealSplit,
  PartnerInfo,
  PartnerLookup,
  Profile,
  UserState,
} from "../types/domain";

export interface CoupleContextValue {
  profile: Profile | null;
  couple: Couple | null;
  partnerInfo: PartnerInfo | null;
  selfAvatarUrl: string | null;
  partnerAvatarUrl: string | null;
  userState: UserState;
  status: LoadStatus;
  error: string | null;
  isBootstrapping: boolean;
  retry: () => void;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: {
    full_name: string;
    birth_date: string;
    monthly_income?: number;
  }) => Promise<{ error?: string; inviteCode?: string }>;
  updateProfile: (data: ProfileUpdateInput) => Promise<{ error?: string }>;
  uploadAvatar: (asset: AvatarPickerAsset) => Promise<{ error?: string }>;
  removeAvatar: () => Promise<{ error?: string }>;
  lookupPartner: (
    inviteCode: string,
  ) => Promise<{ error?: string; partner?: PartnerLookup }>;
  linkPartner: (inviteCode: string) => Promise<{ error?: string }>;
  acceptInvitation: (coupleId: string) => Promise<{ error?: string }>;
  rejectInvitation: (coupleId: string) => Promise<{ error?: string }>;
  endRelationship: () => Promise<{ error?: string }>;
  fetchIdealSplit: () => Promise<ServiceResult<IdealSplit | null>>;
  updateCostPlan: (data: CostPlanInput) => Promise<{ error?: string }>;
}

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null);
  const [selfAvatarUrl, setSelfAvatarUrl] = useState<string | null>(null);
  const [partnerAvatarUrl, setPartnerAvatarUrl] = useState<string | null>(null);
  const [internalStatus, setInternalStatus] = useState<LoadStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const userRef = useRef<User | null>(user);
  const profileRef = useRef<Profile | null>(profile);
  const refreshPromiseRef = useRef<Promise<void> | null>(null);
  const coupleId = couple?.id ?? null;

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const refreshProfile = useCallback(async (userId?: string): Promise<void> => {
    const uid = userId ?? userRef.current?.id;
    if (!uid) return;
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const task = (async () => {
      const profileResult = await profileService.fetchProfile(uid);
      if (profileResult.error) {
        throw new Error(profileResult.error.message);
      }

      setProfile(profileResult.data);
      setSelfAvatarUrl(
        profileResult.data?.avatar_path
          ? await profileService.createAvatarSignedUrl(
              profileResult.data.avatar_path,
            )
          : null,
      );

      if (!profileResult.data) {
        setCouple(null);
        setPartnerInfo(null);
        setPartnerAvatarUrl(null);
      } else {
        const coupleResult = await coupleService.fetchCurrentCouple(uid);
        if (coupleResult.error) {
          throw new Error(coupleResult.error.message);
        }

        setCouple(coupleResult.data);

        if (coupleResult.data) {
          const partnerResult = await coupleService.fetchPartner(
            coupleResult.data,
            uid,
          );
          if (partnerResult.error) {
            throw new Error(partnerResult.error.message);
          }
          setPartnerInfo(partnerResult.data);
          setPartnerAvatarUrl(
            partnerResult.data?.avatar_path
              ? await profileService.createAvatarSignedUrl(
                  partnerResult.data.avatar_path,
                )
              : null,
          );
        } else {
          setPartnerInfo(null);
          setPartnerAvatarUrl(null);
        }
      }

      setLoadedUserId(uid);
    })().finally(() => {
      refreshPromiseRef.current = null;
    });

    refreshPromiseRef.current = task;
    return task;
  }, []);

  useEffect(() => {
    let active = true;

    if (!user) {
      setProfile(null);
      setCouple(null);
      setPartnerInfo(null);
      setSelfAvatarUrl(null);
      setPartnerAvatarUrl(null);
      setLoadedUserId(null);
      setInternalStatus("ready");
      setError(null);
      return;
    }

    setInternalStatus("loading");
    setError(null);

    refreshProfile(user.id)
      .then(() => {
        if (active) setInternalStatus("ready");
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Erro ao carregar seus dados.",
        );
        setInternalStatus("error");
      });

    return () => {
      active = false;
    };
  }, [user, attempt, refreshProfile]);

  useEffect(() => {
    if (!coupleId || !user) return;

    return subscribeToCoupleChanges(coupleId, (updated) => {
      if (updated.status === "ended") {
        // Vínculo encerrado deixa de ser o vínculo atual do usuário.
        refreshProfile().catch(() => {});
        return;
      }

      setCouple(updated);
      if (updated.status === "active") {
        refreshProfile().catch(() => {});
      }
    });
  }, [coupleId, user, refreshProfile]);

  useEffect(() => {
    if (!user) return;

    return subscribeToCoupleInvites(user.id, {
      onInsert: () => {
        refreshProfile().catch(() => {});
      },
      onDelete: () => {
        setCouple(null);
        setPartnerInfo(null);
      },
    });
  }, [user, refreshProfile]);

  const saveProfile = useCallback(
    async (data: {
      full_name: string;
      birth_date: string;
      monthly_income?: number;
    }) => {
      const currentUser = userRef.current;
      if (!currentUser) return { error: "No user" };

      const { error: saveError, profile: savedProfile } =
        await profileService.saveProfile(currentUser.id, data);
      if (saveError) return { error: saveError };

      await refreshProfile(currentUser.id).catch(() => {});
      return { inviteCode: savedProfile?.invite_code ?? undefined };
    },
    [refreshProfile],
  );

  const updateProfile = useCallback(
    async (data: ProfileUpdateInput) => {
      const currentUser = userRef.current;
      if (!currentUser) return { error: "No user" };

      const { error: updateError } = await profileService.updateProfile(
        currentUser.id,
        data,
      );
      if (updateError) return { error: updateError };

      await refreshProfile(currentUser.id).catch(() => {});
      return {};
    },
    [refreshProfile],
  );

  const uploadAvatar = useCallback(
    async (asset: AvatarPickerAsset) => {
      const currentUser = userRef.current;
      if (!currentUser) return { error: "No user" };

      const validation = validateAvatarAsset(asset);
      if (validation.error || !validation.value) {
        return { error: validation.error ?? "Imagem inválida." };
      }

      const path = buildAvatarObjectPath(
        currentUser.id,
        validation.value.mimeType,
        Date.now(),
      );
      const previousPath = profileRef.current?.avatar_path ?? null;

      const uploadResult = await profileService.uploadAvatarObject(
        path,
        decodeAvatarBase64(validation.value.base64),
        validation.value.mimeType,
      );
      if (uploadResult.error) return { error: uploadResult.error };

      const updateResult = await profileService.updateAvatarPath(
        currentUser.id,
        path,
      );
      if (updateResult.error) {
        // Não deixa objeto órfão se a referência não pôde ser persistida.
        await profileService.removeAvatarObject(path);
        return { error: updateResult.error };
      }

      if (previousPath && previousPath !== path) {
        await profileService.removeAvatarObject(previousPath);
      }

      await refreshProfile(currentUser.id).catch(() => {});
      return {};
    },
    [refreshProfile],
  );

  const removeAvatar = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) return { error: "No user" };

    const previousPath = profileRef.current?.avatar_path ?? null;
    const updateResult = await profileService.updateAvatarPath(
      currentUser.id,
      null,
    );
    if (updateResult.error) return { error: updateResult.error };

    if (previousPath) {
      await profileService.removeAvatarObject(previousPath);
    }

    await refreshProfile(currentUser.id).catch(() => {});
    return {};
  }, [refreshProfile]);

  const lookupPartner = useCallback(
    (inviteCode: string) => coupleService.lookupPartner(inviteCode),
    [],
  );

  const linkPartner = useCallback(
    async (inviteCode: string) => {
      if (!userRef.current) return { error: "No user" };
      const result = await coupleService.linkPartner(inviteCode);
      await refreshProfile().catch(() => {});
      return result;
    },
    [refreshProfile],
  );

  const acceptInvitation = useCallback(
    async (coupleId: string) => {
      if (!userRef.current) return { error: "No user" };
      const result = await coupleService.acceptInvitation(coupleId);
      await refreshProfile().catch(() => {});
      return result;
    },
    [refreshProfile],
  );

  const rejectInvitation = useCallback(async (coupleId: string) => {
    if (!userRef.current) return { error: "No user" };
    const result = await coupleService.rejectInvitation(coupleId);
    setCouple(null);
    setPartnerInfo(null);
    setPartnerAvatarUrl(null);
    return result;
  }, []);

  const endRelationship = useCallback(async () => {
    if (!userRef.current) return { error: "No user" };

    const result = await coupleService.endRelationship();
    if (result.error) return result;

    // O vínculo encerrado deixa de ser o vínculo atual imediatamente; a
    // recarga do bootstrap confirma o estado do servidor e limpa o financeiro
    // (o FinanceProvider reage a `couple` nulo/`ended`).
    setCouple(null);
    setPartnerInfo(null);
    setPartnerAvatarUrl(null);
    await refreshProfile().catch(() => {});
    return {};
  }, [refreshProfile]);

  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const fetchIdealSplit = useCallback(async (): Promise<
    ServiceResult<IdealSplit | null>
  > => {
    if (!couple) return ok(null);
    return coupleService.fetchIdealSplit(couple.id);
  }, [couple]);

  const updateCostPlan = useCallback(
    async (data: CostPlanInput) => {
      if (!couple) return { error: "No couple" };
      const { error: updateError } = await coupleService.updateCostPlan(
        couple.id,
        data,
      );
      if (updateError) return { error: updateError };

      await refreshProfile().catch(() => {});
      return {};
    },
    [couple, refreshProfile],
  );

  const userState = deriveUserState(profile, couple);
  const status = deriveCoupleLoadStatus({
    userId: user?.id ?? null,
    loadedUserId,
    internalStatus,
  });

  const value = useMemo<CoupleContextValue>(
    () => ({
      profile,
      couple,
      partnerInfo,
      selfAvatarUrl,
      partnerAvatarUrl,
      userState,
      status,
      error,
      isBootstrapping: status === "loading",
      retry,
      refreshProfile,
      saveProfile,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      lookupPartner,
      linkPartner,
      acceptInvitation,
      rejectInvitation,
      endRelationship,
      fetchIdealSplit,
      updateCostPlan,
    }),
    [
      profile,
      couple,
      partnerInfo,
      selfAvatarUrl,
      partnerAvatarUrl,
      userState,
      status,
      error,
      retry,
      refreshProfile,
      saveProfile,
      updateProfile,
      uploadAvatar,
      removeAvatar,
      lookupPartner,
      linkPartner,
      acceptInvitation,
      rejectInvitation,
      endRelationship,
      fetchIdealSplit,
      updateCostPlan,
    ],
  );

  return (
    <CoupleContext.Provider value={value}>{children}</CoupleContext.Provider>
  );
}

export function useCouple() {
  const ctx = useContext(CoupleContext);
  if (!ctx) throw new Error("useCouple must be used within CoupleProvider");
  return ctx;
}
