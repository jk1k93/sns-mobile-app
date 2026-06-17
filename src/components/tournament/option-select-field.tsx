import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { AppColors } from "@/constants/app-colors";

export type OptionSelectFieldOption<T> = {
  value: T;
  label: string;
};

export type OptionSelectFieldProps<T> = {
  label: ReactNode;
  options: OptionSelectFieldOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
};

export function OptionSelectField<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: OptionSelectFieldProps<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={String(option.value)}
              onPress={() => onChange(option.value)}
              style={[styles.pill, selected && styles.pillSelected]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.pillText, selected && styles.pillTextSelected]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    borderWidth: 1,
    borderColor: "#C8E6D9",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: AppColors.white,
  },
  pillSelected: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
  },
  pillText: {
    fontSize: 15,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  pillTextSelected: {
    color: AppColors.white,
  },
});
