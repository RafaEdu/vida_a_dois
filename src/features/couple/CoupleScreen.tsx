import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCouple } from "../../providers/CoupleProvider";
import { resolvePartnerShares } from "../../domain/finance/split";
import { getInitials } from "../../utils/initials";
import { getFirstName } from "../../utils/name";
import { colors, maxContentWidth, screenPadding, spacing } from "../../theme";
import { ErrorState, LoadingState } from "../../components/ui";
import { TabScreenHeader } from "../../components/shell";
import { buildCoupleDisplayName, deriveCoupleLinkSummary } from "./model";
import { CoupleSummary } from "./components/CoupleSummary";
import { CouplePartners } from "./components/CouplePartners";
import { CoupleSplit } from "./components/CoupleSplit";
import { CoupleLinkCard } from "./components/CoupleLinkCard";
import { CoupleSettingsEntry } from "./components/CoupleSettingsEntry";

export function CoupleScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    partnerInfo,
    couple,
    selfAvatarUrl,
    partnerAvatarUrl,
    status,
    error,
    retry,
  } = useCouple();

  if (status === "error") {
    return (
      <View style={styles.root}>
        <TabScreenHeader title="Casal" />
        <ErrorState
          title="Não foi possível carregar seu casal"
          message={error ?? undefined}
          onRetry={retry}
        />
      </View>
    );
  }

  if (status === "loading" && !profile) {
    return (
      <View style={styles.root}>
        <TabScreenHeader title="Casal" />
        <LoadingState message="Carregando..." />
      </View>
    );
  }

  const link = deriveCoupleLinkSummary(couple);
  const coupleName = buildCoupleDisplayName(
    profile?.full_name,
    partnerInfo?.full_name,
  );
  const selfFirstName = getFirstName(profile?.full_name) || "Você";
  const partnerFirstName = getFirstName(partnerInfo?.full_name) || "Parceiro";
  const { selfShare, partnerShare } =
    couple && profile
      ? resolvePartnerShares(couple, profile.id)
      : { selfShare: 50, partnerShare: 50 };

  return (
    <View style={styles.root}>
      <TabScreenHeader
        title="Casal"
        subtitle="Como nossa vida financeira está configurada"
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 96 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <CoupleSummary
          coupleName={coupleName}
          selfInitials={getInitials(profile?.full_name, "??")}
          partnerInitials={getInitials(partnerInfo?.full_name, "??")}
          selfAvatarUrl={selfAvatarUrl}
          partnerAvatarUrl={partnerAvatarUrl}
          link={link}
        />

        <CouplePartners
          selfName={profile?.full_name ?? "Você"}
          selfInitials={getInitials(profile?.full_name, "??")}
          selfIncome={profile?.monthly_income ?? null}
          selfAvatarUrl={selfAvatarUrl}
          partnerName={partnerInfo?.full_name ?? "Parceiro"}
          partnerInitials={getInitials(partnerInfo?.full_name, "??")}
          partnerIncome={partnerInfo?.monthly_income ?? null}
          partnerAvatarUrl={partnerAvatarUrl}
        />

        <CoupleSplit
          selfName={selfFirstName}
          partnerName={partnerFirstName}
          selfShare={selfShare}
          partnerShare={partnerShare}
          splitMode={couple?.split_mode ?? "manual"}
        />

        <CoupleLinkCard
          statusLabel={link.statusLabel}
          linkedAt={couple?.linked_at ?? null}
        />

        <CoupleSettingsEntry />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    width: "100%",
    maxWidth: maxContentWidth,
    alignSelf: "center",
    paddingHorizontal: screenPadding.compact,
    paddingTop: spacing.lg,
    gap: spacing.xl,
  },
});
