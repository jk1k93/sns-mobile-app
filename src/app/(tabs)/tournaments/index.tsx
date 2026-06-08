import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedView } from "@/components/themed-view";
import { AppColors } from "@/constants/app-colors";
import { useTournamentDraft } from "@/contexts/tournament-draft-context";

export default function TournamentsListScreen() {
  const router = useRouter();
  const { reset } = useTournamentDraft();

  const goCreate = () => {
    reset();
    router.push("/tournaments/create");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tournaments</Text>
          <Pressable
            onPress={goCreate}
            style={({ pressed }) => [styles.createBtn, pressed && styles.createBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Create tournament"
            hitSlop={8}
          >
            <Ionicons name="add" size={26} color={AppColors.primary} />
          </Pressable>
        </View>
        <Text style={styles.subtitle}>
          Browse and join tournaments coming soon.
        </Text>
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
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: AppColors.primary,
  },
  createBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 1,
    borderColor: "#C8E6D9",
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnPressed: {
    opacity: 0.85,
  },
  subtitle: {
    fontSize: 16,
    color: AppColors.textMuted,
  },
});
