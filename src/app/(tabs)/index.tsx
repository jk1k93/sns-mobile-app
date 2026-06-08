import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchSports } from "@/api/sports";
import { SportPickerSheet } from "@/components/sport-picker-sheet";
import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/app-colors";
import { useAuth } from "@/contexts/auth-context";
import { useSelectedSport } from "@/contexts/selected-sport-context";

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedSportId } = useSelectedSport();
  const [pickerOpen, setPickerOpen] = useState(false);

  const sportsQuery = useQuery({
    queryKey: ["sports"],
    queryFn: fetchSports,
  });

  const selectedSportName = useMemo(() => {
    const list = sportsQuery.data ?? [];
    return list.find((s) => s.id === selectedSportId)?.name;
  }, [sportsQuery.data, selectedSportId]);

  const headerLabel =
    sportsQuery.isPending && !selectedSportName
      ? "…"
      : selectedSportName ?? "Sport";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Home</Text>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={styles.sportTrigger}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Selected sport: ${headerLabel}. Tap to change.`}
          >
            <Text
              numberOfLines={1}
              style={styles.sportTriggerText}
              ellipsizeMode="tail"
            >
              {headerLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={18}
              color={AppColors.primary}
              style={styles.sportTriggerIcon}
            />
          </Pressable>
        </View>

        <Text style={styles.subtitle}>
          Signed in as {user?.phoneNumber ?? "—"}
        </Text>

        <SportPickerSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primary,
    flexShrink: 0,
  },
  sportTrigger: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "58%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 1,
    borderColor: "#C8E6D9",
  },
  sportTriggerText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.primaryDark,
  },
  sportTriggerIcon: {
    marginLeft: 4,
    flexShrink: 0,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textMuted,
  },
});
