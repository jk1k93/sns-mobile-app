import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { useAuth, type ProfileCompletionPayload } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

function maskPhone(phone: string): string {
  if (phone.length <= 5) return phone;
  return `${phone.slice(0, 5)} XXXXX`;
}

function normalizeGender(g: string | null | undefined): Gender | null {
  if (!g) return null;
  const x = g.trim().toUpperCase();
  if (x === "M" || x === "MALE") return "male";
  if (x === "F" || x === "FEMALE") return "female";
  const lower = g.toLowerCase();
  if (lower === "male" || lower === "m") return "male";
  if (lower === "female" || lower === "f") return "female";
  return null;
}

type Gender = ProfileCompletionPayload["gender"];

export default function CreateProfileScreen() {
  const { user, completeProfileSetup, signOut } = useAuth();
  const [fullName, setFullName] = useState(user?.name?.trim() ?? "");
  const [email, setEmail] = useState(user?.email?.trim() ?? "");
  const [gender, setGender] = useState<Gender | null>(normalizeGender(user?.gender));
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const canProceed = fullName.trim().length > 0 && gender !== null;

  useEffect(() => {
    setSaveError(null);
  }, [fullName, email, gender, dateOfBirth]);

  const handleProceed = async () => {
    if (!gender || !canProceed) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await completeProfileSetup({
        name: fullName.trim(),
        email: email.trim(),
        gender,
        dateOfBirth: dateOfBirth.trim(),
      });
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Something went wrong";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => void signOut()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color="#1A3C40" />
          </Pressable>
          <Text style={styles.headerTitle}>Create Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={52} color={AppColors.placeholder} />
            </View>
            <Pressable
              style={styles.avatarEdit}
              onPress={() => {}}
              accessibilityLabel="Change profile photo"
            >
              <Ionicons name="pencil" size={16} color={AppColors.white} />
            </Pressable>
          </View>

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Full name"
            placeholderTextColor={AppColors.placeholder}
            autoCapitalize="words"
            autoCorrect
          />

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={styles.genderOption}
              onPress={() => setGender("male")}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: gender === "male" }}
            >
              <View
                style={[
                  styles.checkbox,
                  gender === "male" && styles.checkboxSelected,
                ]}
              >
                {gender === "male" ? (
                  <Ionicons name="checkmark" size={16} color={AppColors.white} />
                ) : null}
              </View>
              <Text style={styles.genderLabel}>Male</Text>
            </Pressable>
            <Pressable
              style={[styles.genderOption, styles.genderOptionLast]}
              onPress={() => setGender("female")}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: gender === "female" }}
            >
              <View
                style={[
                  styles.checkbox,
                  gender === "female" && styles.checkboxSelected,
                ]}
              >
                {gender === "female" ? (
                  <Ionicons name="checkmark" size={16} color={AppColors.white} />
                ) : null}
              </View>
              <Text style={styles.genderLabel}>Female</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, styles.inputReadOnly]}
            value={maskPhone(user?.phoneNumber ?? "")}
            editable={false}
            selectTextOnFocus={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={AppColors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={AppColors.placeholder}
          />

          {saveError ? (
            <Text style={styles.saveError} accessibilityLiveRegion="polite">
              {saveError}
            </Text>
          ) : null}
          <PrimaryButton
            title="Proceed"
            disabled={!canProceed || isSaving}
            loading={isSaving}
            onPress={() => void handleProceed()}
            style={styles.proceed}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#1A3C40",
  },
  headerSpacer: {
    width: 24,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    alignSelf: "center",
    marginBottom: 28,
    marginTop: 8,
  },
  avatarCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: AppColors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarEdit: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: AppColors.white,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A3C40",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: AppColors.textDark,
    marginBottom: 20,
    backgroundColor: AppColors.white,
  },
  inputReadOnly: {
    backgroundColor: "#F5F5F5",
    color: AppColors.textMuted,
  },
  genderRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  genderOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 28,
  },
  genderOptionLast: {
    marginRight: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: AppColors.white,
    marginRight: 10,
  },
  checkboxSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  genderLabel: {
    fontSize: 16,
    color: AppColors.textDark,
  },
  proceed: {
    marginTop: 8,
    borderRadius: 12,
  },
  saveError: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.error,
    marginBottom: 8,
  },
});
