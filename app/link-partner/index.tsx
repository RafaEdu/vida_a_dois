import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Link, router } from "expo-router";
import { useAuth } from "../../src/lib/auth-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles";
import { C } from "../../src/theme/colors";

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
      style={{ flex: 1, backgroundColor: C.surface }}
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
