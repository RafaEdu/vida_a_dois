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
import { useAuth } from "../../src/lib/auth-context";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  formatCurrencyInput,
  parseCurrencyInput,
} from "../../src/utils/currency";
import {
  formatBirthDateInput,
  parseBirthDateToISO,
} from "../../src/utils/date";
import { styles } from "../../src/styles/profile-setup";
import { C } from "../../src/theme/colors";

const REGISTRATION_STEP_KEY = "@registration_step";
const DRAFT_NAME_KEY = "@profile_draft_name";
const DRAFT_BIRTHDATE_KEY = "@profile_draft_birthdate";
const DRAFT_INCOME_KEY = "@profile_draft_income";

export default function ProfileSetup() {
  const { userState, saveProfile } = useAuth();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [income, setIncome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasNavigated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (hasNavigated.current) return;
    if (userState !== "profile_incomplete") {
      hasNavigated.current = true;
      router.replace("/");
    }
  }, [userState]);

  useEffect(() => {
    AsyncStorage.setItem(REGISTRATION_STEP_KEY, "profile").catch(() => {});

    AsyncStorage.multiGet([DRAFT_NAME_KEY, DRAFT_BIRTHDATE_KEY, DRAFT_INCOME_KEY])
      .then((values) => {
        for (const [key, val] of values) {
          if (val) {
            if (key === DRAFT_NAME_KEY) setName(val);
            else if (key === DRAFT_BIRTHDATE_KEY) setBirthDate(val);
            else if (key === DRAFT_INCOME_KEY) setIncome(val);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      AsyncStorage.multiSet([
        [DRAFT_NAME_KEY, name],
        [DRAFT_BIRTHDATE_KEY, birthDate],
        [DRAFT_INCOME_KEY, income],
      ]).catch(() => {});
    }, 500);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [name, birthDate, income]);

  const handleSave = async () => {
    setError("");
    if (!name.trim()) {
      setError("Informe seu nome completo.");
      return;
    }
    const isoDate = parseBirthDateToISO(birthDate);
    if (!isoDate) {
      setError("Informe uma data de nascimento válida (DD/MM/AAAA).");
      return;
    }

    setLoading(true);

    const { error: saveError } = await saveProfile({
      full_name: name.trim(),
      birth_date: isoDate,
      monthly_income: income ? parseCurrencyInput(income) : undefined,
    });
    setLoading(false);

    if (saveError) {
      setError(saveError);
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

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} selectable>{error}</Text>
            </View>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.label}>Nome completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Seu nome completo"
              autoComplete="name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput
              style={styles.input}
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatBirthDateInput(text))}
              placeholder="DD/MM/AAAA"
              keyboardType="number-pad"
              maxLength={10}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Renda mensal líquida</Text>
            <TextInput
              style={styles.input}
              value={income}
              onChangeText={(text) => setIncome(formatCurrencyInput(text))}
              placeholder="R$ 0,00"
              keyboardType="number-pad"
              placeholderTextColor="#999"
            />
            <Text style={styles.optionalHint}>
              Pode preencher depois — vamos perguntar isso no planejamento
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Salvando..." : "Salvar e continuar"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
