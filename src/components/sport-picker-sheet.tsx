import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchSports, type Sport } from "@/api/sports";
import { AppColors } from "@/constants/app-colors";
import { useSelectedSport } from "@/contexts/selected-sport-context";

export type SportPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function SportPickerSheet({ visible, onClose }: SportPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { selectedSportId, selectSport } = useSelectedSport();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const sportsQuery = useQuery({
    queryKey: ["sports"],
    queryFn: fetchSports,
  });

  const handleSelect = async (id: string) => {
    if (id === selectedSportId) {
      onClose();
      return;
    }
    setPendingId(id);
    try {
      await selectSport(id);
      onClose();
    } finally {
      setPendingId(null);
    }
  };

  const renderRow = ({ item }: { item: Sport }) => {
    const selected = item.id === selectedSportId;
    const busy = pendingId === item.id;
    return (
      <Pressable
        onPress={() => void handleSelect(item.id)}
        disabled={pendingId !== null}
        style={[styles.row, selected && styles.rowSelected]}
        accessibilityRole="button"
        accessibilityState={{ selected }}
      >
        <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
          {item.name}
        </Text>
        {busy ? (
          <ActivityIndicator size="small" color={AppColors.primary} />
        ) : selected ? (
          <Ionicons name="checkmark-circle" size={22} color={AppColors.primary} />
        ) : null}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.handle} accessibilityLabel="Sheet handle" />
          <Text style={styles.sheetTitle}>Switch sport</Text>

          {sportsQuery.isPending ? (
            <View style={styles.sheetCentered}>
              <ActivityIndicator size="large" color={AppColors.primary} />
            </View>
          ) : sportsQuery.isError ? (
            <View style={styles.sheetCentered}>
              <Text style={styles.errorText}>Could not load sports.</Text>
              <Pressable onPress={() => sportsQuery.refetch()} hitSlop={8}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={sportsQuery.data ?? []}
              keyExtractor={(item) => item.id}
              renderItem={renderRow}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={styles.empty}>No sports available.</Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "72%",
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#B0BEC5",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 12,
  },
  list: {
    maxHeight: 360,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  rowSelected: {
    backgroundColor: AppColors.surfaceMuted,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textDark,
    marginRight: 12,
  },
  rowLabelSelected: {
    fontWeight: "600",
    color: AppColors.primaryDark,
  },
  sheetCentered: {
    paddingVertical: 32,
    alignItems: "center",
  },
  errorText: {
    fontSize: 15,
    color: AppColors.textMuted,
    textAlign: "center",
    marginBottom: 12,
  },
  retryText: {
    fontSize: 16,
    fontWeight: "600",
    color: AppColors.primary,
  },
  empty: {
    textAlign: "center",
    color: AppColors.textMuted,
    paddingVertical: 24,
  },
});
