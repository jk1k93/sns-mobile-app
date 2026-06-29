import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { searchUserByPhone, type CricketPlayerProfileSummary } from "@/api/users";
import { AppColors } from "@/constants/app-colors";
import { useSelectedSport } from "@/contexts/selected-sport-context";

const SEARCH_DEBOUNCE_MS = 500;

type SearchStatus = "idle" | "searching" | "found" | "not_found" | "error";

export type SelectedPerson = {
  /** null when the person is not yet registered on the platform */
  userId: string | null;
  name: string;
  phone: string;
};

type SinglePersonFieldProps = {
  label: string;
  value: SelectedPerson | null;
  onChange: (person: SelectedPerson | null) => void;
  onPartialPhoneChange?: (isPartial: boolean) => void;
  /** Fires with the in-progress person while name is being typed (not yet confirmed). Null when cleared. */
  onPendingChange?: (pending: SelectedPerson | null) => void;
  /** Fires with the sport-specific profile when a registered user is found. Null if no profile exists. */
  onProfileFound?: (profile: CricketPlayerProfileSummary | null) => void;
};

export function SinglePersonField({ label, value, onChange, onPartialPhoneChange, onPendingChange, onProfileFound }: SinglePersonFieldProps) {
  const { selectedSportId } = useSelectedSport();
  const [phone, setPhone] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  const onPartialPhoneChangeRef = useRef(onPartialPhoneChange);
  const onPendingChangeRef = useRef(onPendingChange);
  const onProfileFoundRef = useRef(onProfileFound);
  const selectedSportIdRef = useRef(selectedSportId);
  useEffect(() => { onChangeRef.current = onChange; });
  useEffect(() => { onPartialPhoneChangeRef.current = onPartialPhoneChange; });
  useEffect(() => { onPendingChangeRef.current = onPendingChange; });
  useEffect(() => { onProfileFoundRef.current = onProfileFound; });
  useEffect(() => { selectedSportIdRef.current = selectedSportId; });

  const phoneDigitCount = (phone.match(/\d/g) ?? []).length;
  const isPhonePartial =
    !value &&
    ((phoneDigitCount > 0 && phoneDigitCount < 10) ||
      (status === "not_found" && nameInput.trim() === ""));

  useEffect(() => {
    onPartialPhoneChangeRef.current?.(isPhonePartial);
  }, [isPhonePartial]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = phone.trim();
    const digitCount = (trimmed.match(/\d/g) ?? []).length;
    if (digitCount < 10) {
      setStatus("idle");
      return;
    }

    setStatus("searching");
    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      if (cancelled) return;
      try {
        const user = await searchUserByPhone(trimmed, selectedSportIdRef.current ?? undefined);
        if (cancelled) return;
        if (user) {
          onChangeRef.current({
            userId: user.id,
            name: user.name ?? trimmed,
            phone: trimmed,
          });
          onProfileFoundRef.current?.(user.cricketPlayerProfile ?? null);
          setPhone("");
          setStatus("idle");
        } else {
          setStatus("not_found");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [phone]);

  useEffect(() => {
    if (status === "not_found") {
      const trimmedName = nameInput.trim();
      onPendingChangeRef.current?.(
        trimmedName ? { userId: null, name: trimmedName, phone: phone.trim() } : null
      );
    } else {
      onPendingChangeRef.current?.(null);
    }
  }, [nameInput, status, phone]);

  const handleAdd = () => {
    if (status !== "not_found" || nameInput.trim().length === 0) return;
    onChange({ userId: null, name: nameInput.trim(), phone: phone.trim() });
    onPendingChangeRef.current?.(null);
    setPhone("");
    setNameInput("");
    setStatus("idle");
  };

  if (value) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.selectedRow}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedName}>{value.name}</Text>
            <Text style={styles.selectedPhone}>{value.phone}</Text>
          </View>
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${value.name}`}
          >
            <Ionicons name="close-circle" size={22} color={AppColors.placeholder} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={phone}
        onChangeText={(t) => {
          if ((t.match(/\d/g) ?? []).length > 10) return;
          setPhone(t);
          setNameInput("");
          setStatus("idle");
        }}
        placeholder="98765 43210"
        placeholderTextColor={AppColors.placeholder}
        keyboardType="phone-pad"
        style={styles.phoneInput}
        autoCorrect={false}
        returnKeyType="done"
      />

      {status === "searching" && (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.statusText}>Searching…</Text>
        </View>
      )}

      {status === "not_found" && (
        <View style={styles.notFoundWrap}>
          <View style={styles.statusRow}>
            <Ionicons name="person-add-outline" size={18} color={AppColors.textMuted} />
            <Text style={styles.statusText}>Not found — enter their name</Text>
          </View>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Full name"
            placeholderTextColor={AppColors.placeholder}
            style={styles.nameInput}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
        </View>
      )}

      {status === "error" && (
        <View style={styles.statusRow}>
          <Ionicons name="alert-circle-outline" size={18} color={AppColors.error} />
          <Text style={[styles.statusText, styles.errorText]}>Search failed. Try again.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    color: AppColors.textMuted,
  },
  errorText: {
    color: AppColors.error,
  },
  notFoundWrap: {
    marginTop: 4,
  },
  nameInput: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  selectedPhone: {
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 2,
  },
});
