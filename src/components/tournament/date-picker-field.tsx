import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppColors } from "@/constants/app-colors";

function parseIso(s: string): Date | null {
  const t = s.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  const d = new Date(`${t}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type DatePickerFieldProps = {
  label: string;
  value: string | null;
  onChange: (iso: string | null) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DatePickerField({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(() => {
    if (value) {
      const p = parseIso(value);
      if (p) return p;
    }
    return new Date();
  });

  const display =
    value && parseIso(value)
      ? value
      : Platform.OS === "web"
        ? ""
        : "Select date";

  const onOpen = () => {
    setTemp(value && parseIso(value) ? parseIso(value)! : new Date());
    setOpen(true);
  };

  if (Platform.OS === "web") {
    return (
      <View style={styles.wrap}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          value={value ?? ""}
          onChangeText={(t) => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(t)) onChange(t);
            else if (t === "") onChange(null);
          }}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={AppColors.placeholder}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [
          styles.row,
          pressed && styles.rowPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
      >
        <Text
          style={[styles.rowText, !value && styles.rowPlaceholder]}
          numberOfLines={1}
        >
          {display}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={AppColors.primary} />
      </Pressable>

      {Platform.OS === "android" && open ? (
        <DateTimePicker
          value={temp}
          mode="date"
          display="default"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={(event, date) => {
            setOpen(false);
            if (event.type === "set" && date) {
              onChange(formatIso(date));
            }
          }}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal visible={open} transparent animationType="slide">
          <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onChange(formatIso(temp));
                    setOpen(false);
                  }}
                  hitSlop={12}
                >
                  <Text style={styles.modalDone}>Done</Text>
                </Pressable>
              </View>
              <DateTimePicker
                value={temp}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                onChange={(_, date) => {
                  if (date) setTemp(date);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: AppColors.white,
  },
  rowPressed: {
    opacity: 0.9,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    color: AppColors.textDark,
  },
  rowPlaceholder: {
    color: AppColors.placeholder,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  modalCancel: {
    fontSize: 17,
    color: AppColors.textMuted,
  },
  modalDone: {
    fontSize: 17,
    fontWeight: "600",
    color: AppColors.primary,
  },
});
