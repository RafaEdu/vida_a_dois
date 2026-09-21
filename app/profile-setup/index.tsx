import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../src/lib/auth-context";
import { parseCurrencyInput } from "../../src/utils/currency";
import { parseBirthDateToISO } from "../../src/utils/date";
import {
  profileSetupFormSchema,
  type ProfileSetupFormInput,
  type ProfileSetupFormValues,
} from "../../src/domain/account/schemas";
import {
  DateInput,
  FormError,
  FormField,
  MoneyInput,
  PrimaryButton,
} from "../../src/components/forms";
import { styles } from "../../src/styles/profile-setup";
import { C } from "../../src/theme/colors";

const REGISTRATION_STEP_KEY = "@registration_step";
const DRAFT_NAME_KEY = "@profile_draft_name";
const DRAFT_BIRTHDATE_KEY = "@profile_draft_birthdate";
const DRAFT_INCOME_KEY = "@profile_draft_income";

export default function ProfileSetup() {
  const { userState, saveProfile } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const hasNavigated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileSetupFormInput, unknown, ProfileSetupFormValues>({
    resolver: zodResolver(profileSetupFormSchema),
    defaultValues: { fullName: "", birthDate: "", income: "" },
  });

  const fullName = useWatch({ control, name: "fullName" }) ?? "";
  const birthDate = useWatch({ control, name: "birthDate" }) ?? "";
  const income = useWatch({ control, name: "income" }) ?? "";

  useEffect(() => {
    if (hasNavigated.current) return;
    if (userState !== "profile_incomplete") {
      hasNavigated.current = true;
      router.replace("/");
    }
  }, [userState]);

  useEffect(() => {
    AsyncStorage.setItem(REGISTRATION_STEP_KEY, "profile").catch(() => {});

    AsyncStorage.multiGet([
      DRAFT_NAME_KEY,
      DRAFT_BIRTHDATE_KEY,
      DRAFT_INCOME_KEY,
    ])
      .then((values) => {
        const draft: Record<string, string> = {};
        for (const [key, val] of values) {
          if (val) draft[key] = val;
        }
        reset({
          fullName: draft[DRAFT_NAME_KEY] ?? "",
          birthDate: draft[DRAFT_BIRTHDATE_KEY] ?? "",
          income: draft[DRAFT_INCOME_KEY] ?? "",
        });
      })
      .catch(() => {});
  }, [reset]);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.multiSet([
        [DRAFT_NAME_KEY, fullName],
        [DRAFT_BIRTHDATE_KEY, birthDate],
        [DRAFT_INCOME_KEY, income],
      ]).catch(() => {});
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [fullName, birthDate, income]);

  const onSubmit = async (values: ProfileSetupFormValues) => {
    setSubmitError("");

    const isoDate = parseBirthDateToISO(values.birthDate);
    if (!isoDate) {
      setSubmitError("Informe uma data de nascimento válida (DD/MM/AAAA).");
      return;
    }

    const { error: saveError } = await saveProfile({
      full_name: values.fullName,
      birth_date: isoDate,
      monthly_income: values.income
        ? parseCurrencyInput(values.income)
        : undefined,
    });

    if (saveError) {
      setSubmitError(saveError);
    } else {
      AsyncStorage.multiRemove([
        DRAFT_NAME_KEY,
        DRAFT_BIRTHDATE_KEY,
        DRAFT_INCOME_KEY,
      ]).catch(() => {});
    }
  };

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
          <Text style={styles.title}>Seu perfil</Text>
          <Text style={styles.subtitle}>
            Conte um pouco sobre você para seu parceiro
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.step}>Etapa 2 de 2</Text>

          <FormError message={submitError} variant="plain" />

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
            label="Data de nascimento"
            error={errors.birthDate?.message}
            labelStyle={styles.label}
          >
            <Controller
              control={control}
              name="birthDate"
              render={({ field }) => (
                <DateInput
                  variant="br"
                  style={styles.input}
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
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
            <Text style={styles.optionalHint}>
              Pode preencher depois — vamos perguntar isso no planejamento
            </Text>
          </FormField>

          <PrimaryButton
            title={isSubmitting ? "Salvando..." : "Salvar e continuar"}
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            style={styles.button}
            textStyle={styles.buttonText}
            disabledStyle={styles.buttonDisabled}
            pressedStyle={styles.buttonPressed}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
