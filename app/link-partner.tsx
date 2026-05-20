import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Link, router } from "expo-router";
import { useAuth } from "../src/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

function formatCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

function getInitials(name: string | undefined | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function LinkPartner() {
  const {
    profile,
    user,
    couple,
    partnerInfo,
    lookupPartner,
    linkPartner,
    acceptInvitation,
    rejectInvitation,
    refreshProfile,
  } = useAuth();

  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [linking, setLinking] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [foundPartner, setFoundPartner] = useState<{ id: string; full_name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const hasNavigated = useRef(false);

  useEffect(() => {
    AsyncStorage.setItem("@registration_step", "link").catch(() => {});
  }, []);

  useEffect(() => {
    if (couple?.status === "active") return;
    if (partnerInfo) {
      setFoundPartner(partnerInfo);
    }
  }, [partnerInfo, couple]);

  useEffect(() => {
    if (couple?.status === "active" && !hasNavigated.current) {
      setConfirmed(true);
      const timer = setTimeout(() => {
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          router.replace("/home");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [couple?.status]);

  const handleCopy = async () => {
    if (!profile?.invite_code) return;
    await Clipboard.setStringAsync(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLookup = async () => {
    setError("");
    const code = partnerCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (code.length !== 8) {
      setError("O código deve ter 8 caracteres.");
      return;
    }

    setLookingUp(true);
    const { error: lookupError, partner } = await lookupPartner(code);
    setLookingUp(false);

    if (lookupError) {
      setError(lookupError);
      setFoundPartner(null);
      return;
    }

    if (partner) {
      setFoundPartner(partner);
    }
  };

  const handleLink = async () => {
    setError("");
    const code = partnerCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    setLinking(true);
    const { error: linkError } = await linkPartner(code);
    setLinking(false);

    if (linkError) {
      setError(linkError);
    }
  };

  const handleAccept = async () => {
    if (!couple) return;
    setError("");
    setAccepting(true);
    const { error: acceptError } = await acceptInvitation(couple.id);
    setAccepting(false);

    if (acceptError) {
      setError(acceptError);
    }
  };

  const handleReject = async () => {
    if (!couple) return;
    setError("");
    setRejecting(true);
    const { error: rejectError } = await rejectInvitation(couple.id);
    setRejecting(false);

    if (rejectError) {
      setError(rejectError);
    }
  };

  // If couple is pending, show appropriate screen based on role
  if (couple?.status === "pending") {
    const isReceiver = couple.user_b === user?.id;

    return (
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        {isReceiver ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Convite recebido</Text>
            </View>

            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(partnerInfo?.full_name)}
                </Text>
              </View>
              <View style={styles.connectionLine} />
              <View style={[styles.avatar, styles.avatarPending]}>
                <Text style={styles.avatarText}>
                  {getInitials(profile?.full_name)}
                </Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Você</Text>
                </View>
              </View>
            </View>

            <Text style={styles.inviteText}>
              {partnerInfo?.full_name ?? "Alguém"} quer começar uma vida a dois com você
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.rejectButton,
                  rejecting && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleReject}
                disabled={rejecting || accepting}
              >
                <Text style={styles.rejectButtonText}>
                  {rejecting ? "..." : "Recusar"}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.acceptButton,
                  accepting && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleAccept}
                disabled={accepting || rejecting}
              >
                <Text style={styles.acceptButtonText}>
                  {accepting ? "..." : "Aceitar"}
                </Text>
              </Pressable>
            </View>

            <View style={styles.codeDisplay}>
              <Text style={styles.codeLabel}>Seu código</Text>
              <Text style={styles.codeValue} selectable>
                {profile?.invite_code ? formatCode(profile.invite_code) : "---"}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
                onPress={handleCopy}
              >
                <Text style={styles.copyButtonText}>
                  {copied ? "Copiado!" : "Copiar"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Aguardando parceiro</Text>
            </View>

            <View style={styles.avatarRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {getInitials(profile?.full_name)}
                </Text>
              </View>
              <View style={styles.connectionLine} />
              <View style={[styles.avatar, styles.avatarPending]}>
                <Text style={styles.avatarText}>
                  {getInitials(partnerInfo?.full_name)}
                </Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Pendente</Text>
                </View>
              </View>
            </View>

            {partnerInfo && (
              <Text style={styles.waitingText}>
                Aguardando {partnerInfo.full_name} aceitar o convite
              </Text>
            )}

            <View style={styles.codeDisplay}>
              <Text style={styles.codeLabel}>Seu código</Text>
              <Text style={styles.codeValue} selectable>
                {profile?.invite_code ? formatCode(profile.invite_code) : "---"}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.copyButton,
                  pressed && styles.copyButtonPressed,
                ]}
                onPress={handleCopy}
              >
                <Text style={styles.copyButtonText}>
                  {copied ? "Copiado!" : "Copiar"}
                </Text>
              </Pressable>
            </View>
          </>
        )}

        <Link href="/profile" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Editar meu perfil</Text>
          </Pressable>
        </Link>
      </ScrollView>
    );
  }

  // If couple is active, show confirmation then redirect
  if (couple?.status === "active") {
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {confirmed ? "Vinculado com sucesso!" : "Vínculo confirmado"}
          </Text>
        </View>

        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.full_name)}
            </Text>
          </View>
          <View style={[styles.connectionLine, styles.connectionLineSolid]} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(partnerInfo?.full_name)}
            </Text>
          </View>
        </View>

        <View style={styles.linkedBadge}>
          <Text style={styles.linkedBadgeText}>Vinculados</Text>
        </View>

        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>{confirmed ? "\u2705" : "\u2764\uFE0F"}</Text>
        </View>

        <Text style={styles.confirmedText}>
          {confirmed
            ? "Redirecionando para o planejamento financeiro..."
            : "Agora vamos configurar a vida financeira de vocês juntos"}
        </Text>

        {!hasNavigated.current && (
          <Link href="/home" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonText}>Começar planejamento</Text>
            </Pressable>
          </Link>
        )}
      </ScrollView>
    );
  }

  // Default: show invite code and partner code input
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FAFAFA" }}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Vincular parceiro</Text>
          <Text style={styles.subtitle}>
            Conecte-se com a pessoa que vai compartilhar a vida financeira com você
          </Text>
        </View>

        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.full_name)}
            </Text>
          </View>
          <View style={[styles.connectionLine, styles.connectionLineDashed]} />
          <View style={[styles.avatar, styles.avatarEmpty]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
        </View>

        <View style={styles.codeDisplay}>
          <Text style={styles.codeLabel}>Seu código de convite</Text>
          <Text style={styles.codeValue} selectable>
            {profile?.invite_code ? formatCode(profile.invite_code) : "---"}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.copyButton,
              pressed && styles.copyButtonPressed,
            ]}
            onPress={handleCopy}
          >
            <Text style={styles.copyButtonText}>
              {copied ? "Copiado!" : "Copiar"}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.instruction}>
          Compartilhe este código com seu parceiro e insira o código dele abaixo
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText} selectable>{error}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Código do parceiro</Text>
          <View style={styles.codeInputRow}>
            <TextInput
              style={styles.input}
              value={partnerCode}
              onChangeText={setPartnerCode}
              placeholder="A7F3-B2C1"
              autoCapitalize="characters"
              maxLength={9}
              placeholderTextColor="#999"
            />
            <Pressable
              style={({ pressed }) => [
                styles.lookupButton,
                (partnerCode.replace(/[^A-Za-z0-9]/g, "").length !== 8 || lookingUp) &&
                  styles.lookupButtonDisabled,
                pressed && styles.lookupButtonPressed,
              ]}
              onPress={handleLookup}
              disabled={
                partnerCode.replace(/[^A-Za-z0-9]/g, "").length !== 8 || lookingUp
              }
            >
              <Text style={styles.lookupButtonText}>
                {lookingUp ? "..." : "Verificar"}
              </Text>
            </Pressable>
          </View>
        </View>

        {foundPartner && (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerAvatarText}>
                {getInitials(foundPartner.full_name)}
              </Text>
            </View>
            <View style={styles.partnerInfo}>
              <Text style={styles.partnerName}>{foundPartner.full_name}</Text>
              <Text style={styles.partnerStatus}>Código válido</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                linking && styles.confirmButtonDisabled,
                pressed && styles.confirmButtonPressed,
              ]}
              onPress={handleLink}
              disabled={linking}
            >
              <Text style={styles.confirmButtonText}>
                {linking ? "..." : "Vincular"}
              </Text>
            </Pressable>
          </View>
        )}

        <Link href="/profile" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.secondaryButtonPressed,
            ]}
          >
            <Text style={styles.secondaryButtonText}>Editar meu perfil</Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarEmpty: {
    backgroundColor: "#E0E0E0",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CCC",
  },
  avatarPending: {
    backgroundColor: "#FFB347",
  },
  avatarText: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
  },
  connectionLine: {
    width: 48,
    height: 2,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 8,
  },
  connectionLineDashed: {
    backgroundColor: "transparent",
    borderTopWidth: 2,
    borderStyle: "dashed",
    borderColor: "#CCC",
  },
  connectionLineSolid: {
    backgroundColor: "#FF6B6B",
  },
  pendingBadge: {
    position: "absolute",
    bottom: -20,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  pendingBadgeText: {
    fontSize: 10,
    color: "#E65100",
    fontWeight: "600",
  },
  waitingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
  },
  inviteText: {
    fontSize: 18,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
    lineHeight: 26,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)",
  },
  acceptButtonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  rejectButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  rejectButtonText: {
    color: "#999",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  confirmedText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  checkmarkContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  checkmark: {
    fontSize: 48,
  },
  linkedBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "center",
    marginBottom: 16,
  },
  linkedBadgeText: {
    color: "#2E7D32",
    fontWeight: "600",
    fontSize: 14,
  },
  codeDisplay: {
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  codeLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 4,
    fontVariant: ["tabular-nums"],
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  copyButtonText: {
    color: "#FF6B6B",
    fontWeight: "600",
    fontSize: 14,
  },
  instruction: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: "#FFF0F0",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 14,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1A1A1A",
    letterSpacing: 2,
  },
  codeInputRow: {
    flexDirection: "row",
    gap: 8,
  },
  lookupButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  lookupButtonDisabled: {
    backgroundColor: "#FFB3B3",
  },
  lookupButtonPressed: {
    opacity: 0.85,
  },
  lookupButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  partnerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FFF0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  partnerAvatarText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  partnerStatus: {
    fontSize: 12,
    color: "#4CAF50",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: "#A5D6A7",
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmButtonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    boxShadow: "0 2px 8px rgba(255, 107, 107, 0.3)",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 17,
    fontWeight: "600",
  },
  secondaryButton: {
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  secondaryButtonPressed: {
    opacity: 0.7,
  },
  secondaryButtonText: {
    color: "#FF6B6B",
    fontSize: 15,
    fontWeight: "600",
  },
});
