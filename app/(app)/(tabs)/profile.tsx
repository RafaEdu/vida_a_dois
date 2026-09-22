import { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../../src/lib/auth-context";
import {
  formatCurrency,
  parseCurrencyInput,
} from "../../../src/utils/currency";
import { formatDateOnlyForDisplay } from "../../../src/utils/date";
import { getInitials } from "../../../src/utils/initials";
import {
  profileEditFormSchema,
  type ProfileEditFormInput,
  type ProfileEditFormValues,
} from "../../../src/domain/account/schemas";
import {
  FormError,
  FormField,
  MoneyInput,
  PrimaryButton,
} from "../../../src/components/forms";
import { TabScreenHeader } from "../../../src/components/shell";
import { styles } from "../../../src/styles/profile";
import { C } from "../../../src/theme/colors";

export default function Profile() {
  const { profile, signOut, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileEditFormInput, unknown, ProfileEditFormValues>({
    resolver: zodResolver(profileEditFormSchema),
    defaultValues: { fullName: "", income: "" },
  });

  const startEditing = () => {
    reset({ fullName: profile?.full_name ?? "", income: "" });
    setSubmitError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    reset({ fullName: profile?.full_name ?? "", income: "" });
    setSubmitError("");
    setEditing(false);
  };

  const onSubmit = async (values: ProfileEditFormValues) => {
    setSubmitError("");
    try {
      const { error: updateError } = await updateProfile({
        full_name: values.fullName,
        monthly_income: values.income
          ? parseCurrencyInput(values.income)
          : null,
      });

      if (updateError) {
        setSubmitError(updateError);
      } else {
        setEditing(false);
      }
    } catch {
      setSubmitError("Erro inesperado ao salvar.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: C.surface }}
    >
      <TabScreenHeader title="Casal" />
      <ScrollView
        contentContainerStyle={styles.container}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {getInitials(profile?.full_name)}
            </Text>
          </View>
        </View>

        <FormError message={submitError} variant="plain" />

        {editing ? (
          <>
            <FormField
              label="Nome completo"
              error={errors.fullName?.message}
              labelStyle={styles.label}
            >
              <Controller
                control={control}
                name="fullName"
                render={({ field }) => (
                  <TextInput
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    placeholderTextColor="#999"
                  />
                )}
              />
            </FormField>

            <FormField
              label="Renda mensal líquida"
              error={errors.income?.message}
              labelStyle={styles.label}
            >
              <Controller
                control={control}
                name="income"
                render={({ field }) => (
                  <MoneyInput
                    variant="currency"
                    style={styles.input}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormField>

            <View style={styles.editButtons}>
              <PrimaryButton
                title={isSubmitting ? "Salvando..." : "Salvar"}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                style={styles.saveButton}
                textStyle={styles.buttonText}
                pressedStyle={styles.buttonPressed}
                disabledStyle={styles.buttonDisabled}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && styles.cancelButtonPressed,
                ]}
                onPress={cancelEditing}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nome</Text>
                <Text style={styles.infoValue}>{profile?.full_name}</Text>
              </View>
              {profile?.birth_date && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Nascimento</Text>
                  <Text style={styles.infoValue}>
                    {formatDateOnlyForDisplay(profile.birth_date)}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Renda mensal</Text>
                <Text style={styles.infoValue}>
                  {formatCurrency(profile?.monthly_income ?? null)}
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
              onPress={startEditing}
            >
              <Text style={styles.editButtonText}>Editar perfil</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.signOutButton,
                pressed && styles.signOutButtonPressed,
              ]}
              onPress={signOut}
            >
              <Text style={styles.signOutText}>Sair da conta</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
