import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCouple } from "../../providers/CoupleProvider";
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

export function CoupleScreen() {
  const insets = useSafeAreaInsets();
  const { profile, partnerInfo, couple, status, error, retry } = useCouple();

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
  const splitA = couple?.split_ratio_a ?? 50;
  const splitB = couple?.split_ratio_b ?? 50;

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
          link={link}
        />

        <CouplePartners
          selfName={profile?.full_name ?? "Você"}
          selfInitials={getInitials(profile?.full_name, "??")}
          selfIncome={profile?.monthly_income ?? null}
          partnerName={partnerInfo?.full_name ?? "Parceiro"}
          partnerInitials={getInitials(partnerInfo?.full_name, "??")}
          partnerIncome={partnerInfo?.monthly_income ?? null}
        />

        <CoupleSplit
          selfName={selfFirstName}
          partnerName={partnerFirstName}
          splitA={splitA}
          splitB={splitB}
        />

        <CoupleLinkCard
          statusLabel={link.statusLabel}
          linkedAt={couple?.linked_at ?? null}
        />
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
