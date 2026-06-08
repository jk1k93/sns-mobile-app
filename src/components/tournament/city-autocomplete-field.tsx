import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { fetchCityPredictions, type CityPrediction } from "@/lib/google-places";
import { AppColors } from "@/constants/app-colors";

export type CityAutocompleteFieldProps = {
  label: string;
  value: string;
  onChange: (cityLabel: string) => void;
  onSelectPrediction?: (prediction: CityPrediction) => void;
  disabled?: boolean;
};

export function CityAutocompleteField({
  label,
  value,
  onChange,
  onSelectPrediction,
  disabled = false,
}: CityAutocompleteFieldProps) {
  const [query, setQuery] = useState(value);
  const [predictions, setPredictions] = useState<CityPrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    if (q.length < 2 || !focused) {
      setPredictions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const next = await fetchCityPredictions(q);
        if (!cancelled) setPredictions(next);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, focused]);

  const showList =
    focused && query.trim().length >= 2 && (predictions.length > 0 || loading);

  const webHint =
    Platform.OS === "web" &&
    !process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim();

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            onChange(t);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 320)}
          placeholder="Search city"
          placeholderTextColor={AppColors.placeholder}
          style={styles.input}
          editable={!disabled}
          autoCorrect={false}
        />
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={AppColors.primary} />
          </View>
        ) : null}
      </View>
      {webHint ? (
        <Text style={styles.envHint}>
          Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY for suggestions. You can type the
          city name manually.
        </Text>
      ) : null}
      {!process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY?.trim() &&
      Platform.OS !== "web" ? (
        <Text style={styles.envHint}>
          Set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY for Google city suggestions.
        </Text>
      ) : null}
      {showList ? (
        <View style={styles.listWrap}>
          <ScrollView
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {predictions.map((item) => (
              <Pressable
                key={item.placeId}
                style={({ pressed }) => [
                  styles.row,
                  pressed && styles.rowPressed,
                ]}
                onPress={() => {
                  onChange(item.description);
                  onSelectPrediction?.(item);
                  setQuery(item.description);
                  setFocused(false);
                  setPredictions([]);
                }}
              >
                <Text style={styles.rowText}>{item.description}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: AppColors.textDark,
    backgroundColor: AppColors.white,
  },
  loader: {
    position: "absolute",
    right: 12,
    top: 12,
  },
  listWrap: {
    marginTop: 6,
    maxHeight: 180,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    backgroundColor: AppColors.white,
    overflow: "hidden",
  },
  list: {
    maxHeight: 180,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ECEFF1",
  },
  rowPressed: {
    backgroundColor: AppColors.surfaceMuted,
  },
  rowText: {
    fontSize: 15,
    color: AppColors.textDark,
  },
  envHint: {
    marginTop: 6,
    fontSize: 12,
    color: AppColors.textMuted,
  },
});
