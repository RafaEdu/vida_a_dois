import { useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../src/lib/auth-context";

export default function Home() {
  const { profile, partnerInfo, userState, signOut } = useAuth();
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (userState !== "linked") {
      hasNavigated.current = true;
      router.replace("/");
    }
  }, [userState]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      contentInsetAdjustmentBehavior="automatic"
    >
      <View style={styles.coupleCard}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text style={styles.and}>&</Text>
          <View style={[styles.avatar, styles.partnerAvatar]}>
            <Text style={styles.avatarText}>
              {partnerInfo?.full_name
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() ?? "?"}
            </Text>
          </View>
        </View>
        <Text style={styles.coupleText}>
          {profile?.full_name} & {partnerInfo?.full_name}
        </Text>
      </View>

      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonTitle}>Em breve</Text>
        <Text style={styles.comingSoonText}>
          O planejamento financeiro completo estará disponível aqui:
        </Text>
        <View style={styles.featureList}>
          <Text style={styles.featureItem}>{"\u2022"} Orçamento mensal compartilhado</Text>
          <Text style={styles.featureItem}>{"\u2022"} Divisão de custos personalizada</Text>
          <Text style={styles.featureItem}>{"\u2022"} Categorias pré-definidas</Text>
          <Text style={styles.featureItem}>{"\u2022"} Alertas de gastos</Text>
          <Text style={styles.featureItem}>{"\u2022"} Relatórios mensais</Text>
        </View>
      </View>

      <View style={styles.linkRow}>
        <Link href="/profile" asChild>
          <Pressable style={({ pressed }) => [
            styles.linkButton,
            pressed && styles.linkButtonPressed,
          ]}>
            <Text style={styles.linkButtonText}>Meu perfil</Text>
          </Pressable>
        </Link>
        <Pressable
          style={({ pressed }) => [
            styles.linkButton,
            styles.signOutButton,
            pressed && styles.signOutButtonPressed,
          ]}
          onPress={signOut}
        >
          <Text style={styles.signOutText}>Sair</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  coupleCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
    marginBottom: 32,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  partnerAvatar: {
    backgroundColor: "#4ECDC4",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 26,
    fontWeight: "700",
  },
  and: {
    fontSize: 28,
    color: "#FF6B6B",
    fontWeight: "300",
    marginHorizontal: 16,
  },
  coupleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    textAlign: "center",
  },
  comingSoon: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    marginBottom: 32,
  },
  comingSoonTitle: {
    fontSize: 13,
    color: "#FF6B6B",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 16,
    lineHeight: 22,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  linkRow: {
    gap: 12,
  },
  linkButton: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  linkButtonPressed: {
    opacity: 0.7,
  },
  linkButtonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  signOutButtonPressed: {
    backgroundColor: "#FAFAFA",
  },
  signOutText: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
});
