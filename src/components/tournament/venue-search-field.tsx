import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Venue } from "@/api/venues";
import { AppColors } from "@/constants/app-colors";

function venueLabel(v: Venue): string {
  const parts = [v.name, v.city, v.address].filter(Boolean);
  return parts.join(" · ");
}

export type VenueSearchFieldProps = {
  label?: string;
  venues: Venue[];
  value: Venue | null;
  onChange: (v: Venue | null) => void;
  onAddNewVenue: () => void;
  disabled?: boolean;
};

export function VenueSearchField({
  label = "Tournament location",
  venues,
  value,
  onChange,
  onAddNewVenue,
  disabled = false,
}: VenueSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return venues.slice(0, 8);
    return venues.filter((v) => {
      const hay = `${v.name} ${v.city ?? ""} ${v.address ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [venues, query]);

  const showList = focused && !disabled;
  const hasQuery = query.trim().length > 0;
  const noMatches = hasQuery && filtered.length === 0;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          value={value ? venueLabel(value) : query}
          onChangeText={(t) => {
            if (value) {
              onChange(null);
              setQuery(t);
            } else {
              setQuery(t);
            }
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 320);
          }}
          placeholder="Search venues or add new…"
          placeholderTextColor={AppColors.placeholder}
          style={styles.input}
          editable={!disabled}
          autoCorrect={false}
        />
        {(value || query.length > 0) && !disabled ? (
          <Pressable
            onPress={() => {
              onChange(null);
              setQuery("");
            }}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityLabel="Clear venue"
          >
            <Ionicons name="close-circle" size={22} color={AppColors.placeholder} />
          </Pressable>
        ) : null}
      </View>

      {showList ? (
        <View style={styles.listWrap}>
          {filtered.length > 0 ? (
            <ScrollView
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {filtered.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.suggestion,
                    pressed && styles.suggestionPressed,
                  ]}
                  onPress={() => {
                    onChange(item);
                    setQuery("");
                    setFocused(false);
                  }}
                >
                  <Text style={styles.suggestionTitle}>{item.name}</Text>
                  {(item.city || item.address) ? (
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {[item.city, item.address].filter(Boolean).join(" · ")}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          ) : null}

          {noMatches ? (
            <Text style={styles.hint}>No venues match your search.</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.addNew,
              pressed && styles.addNewPressed,
            ]}
            onPress={() => {
              setFocused(false);
              onAddNewVenue();
            }}
          >
            <Ionicons name="add-circle-outline" size={22} color={AppColors.primary} />
            <Text style={styles.addNewText}>Add new venue</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
    zIndex: 2,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  inputRow: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingRight: 40,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
  },
  clearBtn: {
    position: "absolute",
    right: 10,
  },
  listWrap: {
    marginTop: 6,
    maxHeight: 240,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    backgroundColor: AppColors.white,
    overflow: "hidden",
  },
  list: {
    maxHeight: 160,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ECEFF1",
  },
  suggestionPressed: {
    backgroundColor: AppColors.surfaceMuted,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  suggestionSub: {
    fontSize: 13,
    color: AppColors.textMuted,
    marginTop: 2,
  },
  hint: {
    padding: 12,
    fontSize: 14,
    color: AppColors.textMuted,
  },
  addNew: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#C8E6D9",
    backgroundColor: AppColors.surfaceMuted,
  },
  addNewPressed: {
    opacity: 0.85,
  },
  addNewText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary,
  },
});
