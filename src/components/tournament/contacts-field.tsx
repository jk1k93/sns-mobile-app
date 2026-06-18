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

import { searchUserByPhone, type UserSummary } from "@/api/users";
import { AppColors } from "@/constants/app-colors";
import type { DraftContact } from "@/contexts/tournament-draft-context";

const SEARCH_DEBOUNCE_MS = 500;

type SearchStatus = "idle" | "searching" | "found" | "not_found" | "error";

type ContactsFieldProps = {
  contacts: DraftContact[];
  onAdd: (contact: DraftContact) => void;
  onRemove: (phone: string) => void;
};

export function ContactsField({ contacts, onAdd, onRemove }: ContactsFieldProps) {
  const [phone, setPhone] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const [foundUser, setFoundUser] = useState<UserSummary | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAddRef = useRef(onAdd);
  const contactsRef = useRef(contacts);
  useEffect(() => { onAddRef.current = onAdd; });
  useEffect(() => { contactsRef.current = contacts; });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = phone.trim();
    const digitCount = (trimmed.match(/\d/g) ?? []).length;
    if (digitCount < 10) {
      setStatus("idle");
      setFoundUser(null);
      return;
    }

    setStatus("searching");
    let cancelled = false;

    debounceRef.current = setTimeout(async () => {
      if (cancelled) return;
      try {
        const user = await searchUserByPhone(trimmed);
        if (!cancelled) {
          if (user) {
            setFoundUser(user);
            setStatus("found");
          } else {
            setFoundUser(null);
            setStatus("not_found");
          }
        }
      } catch {
        if (!cancelled) {
          setFoundUser(null);
          setStatus("error");
        }
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [phone]);

  useEffect(() => {
    if (status !== "found" || !foundUser) return;
    const trimmedPhone = phone.trim();
    if (contactsRef.current.some((c) => c.phone.trim() === trimmedPhone)) return;
    onAddRef.current({
      userId: foundUser.id,
      name: foundUser.name ?? trimmedPhone,
      phone: trimmedPhone,
    });
    setPhone("");
    setStatus("idle");
    setFoundUser(null);
  }, [status, foundUser, phone]);

  const isAlreadyAdded =
    phone.trim().length > 0 &&
    contacts.some((c) => c.phone.trim() === phone.trim());

  const canAdd =
    !isAlreadyAdded &&
    status === "not_found" &&
    nameInput.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    const trimmedPhone = phone.trim();
    onAdd({ name: nameInput.trim(), phone: trimmedPhone });

    setPhone("");
    setNameInput("");
    setStatus("idle");
    setFoundUser(null);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Contacts</Text>

      <View style={styles.phoneRow}>
        <TextInput
          value={phone}
          onChangeText={(t) => {
            setPhone(t);
            setNameInput("");
            setFoundUser(null);
            setStatus("idle");
          }}
          placeholder="+91 98765 43210"
          placeholderTextColor={AppColors.placeholder}
          keyboardType="phone-pad"
          style={styles.phoneInput}
          autoCorrect={false}
          returnKeyType="done"
        />
        <Pressable
          onPress={handleAdd}
          disabled={!canAdd}
          style={({ pressed }) => [
            styles.addBtn,
            !canAdd && styles.addBtnDisabled,
            pressed && canAdd && styles.addBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add contact"
        >
          <Ionicons
            name="add"
            size={22}
            color={canAdd ? AppColors.white : AppColors.onPrimaryDisabledLabel}
          />
        </Pressable>
      </View>

      {status === "searching" ? (
        <View style={styles.statusRow}>
          <ActivityIndicator size="small" color={AppColors.primary} />
          <Text style={styles.statusText}>Searching…</Text>
        </View>
      ) : null}

      {status === "not_found" ? (
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
      ) : null}

      {status === "error" ? (
        <View style={styles.statusRow}>
          <Ionicons name="alert-circle-outline" size={18} color={AppColors.error} />
          <Text style={[styles.statusText, styles.errorText]}>
            Search failed. Try again.
          </Text>
        </View>
      ) : null}

      {isAlreadyAdded ? (
        <Text style={styles.duplicateText}>This number is already added.</Text>
      ) : null}

      {contacts.length > 0 ? (
        <View style={styles.contactsList}>
          {contacts.map((c) => (
            <View key={c.phone} style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactPhone}>{c.phone}</Text>
              </View>
              <Pressable
                onPress={() => onRemove(c.phone)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${c.name}`}
              >
                <Ionicons
                  name="close-circle"
                  size={22}
                  color={AppColors.placeholder}
                />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
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
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnDisabled: {
    backgroundColor: AppColors.primaryDisabled,
  },
  addBtnPressed: {
    opacity: 0.85,
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
  duplicateText: {
    marginTop: 6,
    fontSize: 13,
    color: AppColors.error,
  },
  contactsList: {
    marginTop: 12,
    gap: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  contactPhone: {
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 2,
  },
});
