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
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/lib/auth-context";
import type { PartnerLookup } from "../../src/types/domain";
import {
  partnerCodeFormSchema,
  type PartnerCodeFormInput,
  type PartnerCodeFormValues,
} from "../../src/domain/account/schemas";
import { FormError, FormField } from "../../src/components/forms";
import { getInitials } from "../../src/utils/initials";
import { styles } from "../../src/styles/link-partner";
import { C } from "../../src/theme/colors";

function formatCode(code: string): string {
  if (code.length !== 8) return code;
  return `${code.slice(0, 4)}-${code.slice(4, 8)}`;
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
  } = useAuth();

  const [submitError, setSubmitError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [linking, setLinking] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [foundPartner, setFoundPartner] = useState<PartnerLookup | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const hasNavigated = useRef(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PartnerCodeFormInput, unknown, PartnerCodeFormValues>({
    resolver: zodResolver(partnerCodeFormSchema),
    defaultValues: { code: "" },
  });

  const codeValue = useWatch({ control, name: "code" }) ?? "";
  const normalizedCodeLength = codeValue.replace(/[^A-Za-z0-9]/g, "").length;

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

  const handleLookup = async (values: PartnerCodeFormValues) => {
    setSubmitError("");
    setLookingUp(true);
    const { error: lookupError, partner } = await lookupPartner(values.code);
    setLookingUp(false);

    if (lookupError) {
      setSubmitError(lookupError);
      setFoundPartner(null);
      return;
    }

    if (partner) {
      setFoundPartner(partner);
    }
  };

  const handleLink = async (values: PartnerCodeFormValues) => {
    setSubmitError("");

    setLinking(true);
    const { error: linkError } = await linkPartner(values.code);
    setLinking(false);

    if (linkError) {
      setSubmitError(linkError);
    }
  };

  const handleAccept = async () => {
    if (!couple) return;
    setSubmitError("");
    setAccepting(true);
    const { error: acceptError } = await acceptInvitation(couple.id);
    setAccepting(false);

    if (acceptError) {
      setSubmitError(acceptError);
    }
  };

  const handleReject = async () => {
    if (!couple) return;
    setSubmitError("");
    setRejecting(true);
    const { error: rejectError } = await rejectInvitation(couple.id);
    setRejecting(false);

    if (rejectError) {
      setSubmitError(rejectError);
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
                  {getInitials(partnerInfo?.full_name, "??")}
                </Text>
              </View>
              <View style={styles.connectionLine} />
              <View style={[styles.avatar, styles.avatarPending]}>
                <Text style={styles.avatarText}>
                  {getInitials(profile?.full_name, "??")}
                </Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>Você</Text>
                </View>
              </View>
            </View>

            <Text style={styles.inviteText}>
              {partnerInfo?.full_name ?? "Alguém"} quer começar uma vida a dois
              com você
            </Text>

            <FormError message={submitError} variant="plain" />

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
                  {getInitials(profile?.full_name, "??")}
                </Text>
              </View>
              <View style={styles.connectionLine} />
              <View style={[styles.avatar, styles.avatarPending]}>
                <Text style={styles.avatarText}>
                  {getInitials(partnerInfo?.full_name, "??")}
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
              {getInitials(profile?.full_name, "??")}
            </Text>
          </View>
          <View style={[styles.connectionLine, styles.connectionLineSolid]} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(partnerInfo?.full_name, "??")}
            </Text>
          </View>
        </View>

        <View style={styles.linkedBadge}>
          <Text style={styles.linkedBadgeText}>Vinculados</Text>
        </View>

        <View style={styles.checkmarkContainer}>
          <Text style={styles.checkmark}>
            {confirmed ? "\u2705" : "\u2764\uFE0F"}
          </Text>
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
            Conecte-se com a pessoa que vai compartilhar a vida financeira com
            você
          </Text>
        </View>

        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.full_name, "??")}
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

        <FormError message={submitError} variant="plain" />

        <FormField
          label="Código do parceiro"
          error={errors.code?.message}
          labelStyle={styles.label}
        >
          <View style={styles.codeInputRow}>
            <Controller
              control={control}
              name="code"
              render={({ field }) => (
                <TextInput
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="A7F3-B2C1"
                  autoCapitalize="characters"
                  maxLength={9}
                  placeholderTextColor="#999"
                />
              )}
            />
            <Pressable
              style={({ pressed }) => [
                styles.lookupButton,
                (normalizedCodeLength !== 8 || lookingUp) &&
                  styles.lookupButtonDisabled,
                pressed && styles.lookupButtonPressed,
              ]}
              onPress={handleSubmit(handleLookup)}
              disabled={normalizedCodeLength !== 8 || lookingUp}
            >
              <Text style={styles.lookupButtonText}>
                {lookingUp ? "..." : "Verificar"}
              </Text>
            </Pressable>
          </View>
        </FormField>

        {foundPartner && (
          <View style={styles.partnerCard}>
            <View style={styles.partnerAvatar}>
              <Text style={styles.partnerAvatarText}>
                {getInitials(foundPartner.full_name, "??")}
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
              onPress={handleSubmit(handleLink)}
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
