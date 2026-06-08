import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { fetchSports, type Sport } from "@/api/sports";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useAuth } from "@/contexts/auth-context";
import { useSelectedSport } from "@/contexts/selected-sport-context";
import { AppColors } from "@/constants/app-colors";
import { ApiError } from "@/lib/api";

export default function SelectSportsScreen() {
  const { signOut } = useAuth();
  const { selectSport } = useSelectedSport();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const sportsQuery = useQuery({
    queryKey: ["sports"],
    queryFn: fetchSports,
  });

  const sports = sportsQuery.data ?? [];

  const handleProceed = async () => {
    if (!selectedId) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      await selectSport(selectedId);
    } catch (e) {
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not save selection";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const renderItem = ({ item }: { item: Sport }) => {
    const selected = item.id === selectedId;
    return (
      <Pressable
        onPress={() => setSelectedId(item.id)}
        style={[styles.card, selected && styles.cardSelected]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
          {item.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => void signOut()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#1A3C40" />
        </Pressable>
      </View>

      <Text style={styles.title}>Pick Your Game Interests</Text>

      {sportsQuery.isPending ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={AppColors.primary} />
        </View>
      ) : sportsQuery.isError ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load sports.</Text>
          <Pressable onPress={() => sportsQuery.refetch()} style={styles.retry}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={sports}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>No sports available.</Text>
          }
        />
      )}

      {saveError ? (
        <Text style={styles.saveError} accessibilityLiveRegion="polite">
          {saveError}
        </Text>
      ) : null}

      <PrimaryButton
        title="Proceed"
        disabled={!selectedId || isSaving || sportsQuery.isPending}
        loading={isSaving}
        onPress={() => void handleProceed()}
        style={styles.proceed}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primary,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 16,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flex: 1,
    maxWidth: '48%',
    minHeight: 88,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: AppColors.surfaceMuted,
    padding: 14,
    justifyContent: "flex-end",
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: AppColors.primary,
    backgroundColor: "#E8F5F2",
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  cardLabelSelected: {
    color: AppColors.primaryDark,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: AppColors.textMuted,
    textAlign: "center",
    marginBottom: 12,
  },
  retry: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary,
  },
  empty: {
    textAlign: "center",
    color: AppColors.textMuted,
    marginTop: 24,
    paddingHorizontal: 24,
  },
  saveError: {
    fontSize: 14,
    color: AppColors.error,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  proceed: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 12,
  },
});
