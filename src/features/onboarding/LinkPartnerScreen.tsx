import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../lib/auth-context";
import type { PartnerLookup } from "../../types/domain";
import {
  partnerCodeFormSchema,
  type PartnerCodeFormInput,
  type PartnerCodeFormValues,
} from "../../domain/account/schemas";
import { Screen } from "../../components/ui";
import { colors, spacing } from "../../theme";
import { getInitials } from "../../utils/initials";
import { LinkActiveView, LinkPendingView, LinkRequestView } from "./components";

/**
 * First-time partner linking (onboarding). Administering an existing link is
 * the responsibility of the Casal area, not this screen.
 */
export function LinkPartnerScreen() {
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

  const selfInitials = getInitials(profile?.full_name, "EU");
  const partnerInitials = getInitials(partnerInfo?.full_name, "??");

  if (couple?.status === "pending") {
    const isReceiver = couple.user_b === user?.id;

    return (
      <Screen
        scroll
        padded
        edges={["top", "left", "right", "bottom"]}
        contentContainerStyle={styles.content}
      >
        <LinkPendingView
          isReceiver={isReceiver}
          selfInitials={selfInitials}
          partnerInitials={partnerInitials}
          partnerName={partnerInfo?.full_name}
          inviteCode={profile?.invite_code}
          copied={copied}
          onCopy={handleCopy}
          accepting={accepting}
          rejecting={rejecting}
          onAccept={handleAccept}
          onReject={handleReject}
          submitError={submitError}
        />
      </Screen>
    );
  }

  if (couple?.status === "active") {
    return (
      <Screen
        scroll
        padded
        edges={["top", "left", "right", "bottom"]}
        contentContainerStyle={styles.content}
      >
        <LinkActiveView
          selfInitials={selfInitials}
          partnerInitials={partnerInitials}
          confirmed={confirmed}
          onStart={() => router.replace("/home")}
        />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Screen
        scroll
        padded
        edges={["top", "left", "right", "bottom"]}
        contentContainerStyle={styles.content}
      >
        <LinkRequestView
          selfInitials={selfInitials}
          inviteCode={profile?.invite_code}
          copied={copied}
          onCopy={handleCopy}
          control={control}
          codeError={errors.code?.message}
          codeComplete={normalizedCodeLength === 8}
          lookingUp={lookingUp}
          linking={linking}
          submitError={submitError}
          foundPartner={foundPartner}
          onLookup={handleSubmit(handleLookup)}
          onLink={handleSubmit(handleLink)}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
});
