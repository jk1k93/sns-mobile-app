import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { AppColors } from "@/constants/app-colors";

export type PrimaryButtonProps = {
  title: string;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function PrimaryButton({
  title,
  disabled = false,
  loading = false,
  onPress,
  style,
  textStyle,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isDisabled && styles.buttonDisabled,
        !isDisabled && pressed && styles.buttonPressed,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={AppColors.white} />
        ) : (
          <Text
            style={[styles.label, isDisabled && styles.labelDisabled, textStyle]}
          >
            {title}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    backgroundColor: AppColors.primary,
    alignItems: "center",
    padding: 16,
    justifyContent: "center",
  },
  content: {
    minHeight: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: AppColors.primaryDisabled,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  label: {
    color: AppColors.white,
    fontSize: 16,
    fontWeight: "500",
  },
  labelDisabled: {
    color: AppColors.onPrimaryDisabledLabel,
  },
});
