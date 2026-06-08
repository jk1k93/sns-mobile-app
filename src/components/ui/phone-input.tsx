import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { AppColors } from "@/constants/app-colors";

export const PHONE_DIGIT_LENGTH = 10;

export function sanitizePhoneDigits(text: string): string {
  return text.replace(/\D/g, "").slice(0, PHONE_DIGIT_LENGTH);
}

export type PhoneInputProps = Omit<
  TextInputProps,
  "keyboardType" | "inputMode" | "maxLength" | "onChangeText" | "value"
> & {
  value: string;
  onChangeText: (digits: string) => void;
};

export function PhoneInput({
  value,
  onChangeText,
  style,
  placeholder = "Phone number",
  placeholderTextColor = AppColors.placeholder,
  ...rest
}: PhoneInputProps) {
  return (
    <TextInput
      style={[styles.input, style]}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      keyboardType="number-pad"
      inputMode="numeric"
      maxLength={PHONE_DIGIT_LENGTH}
      value={value}
      onChangeText={(text) => onChangeText(sanitizePhoneDigits(text))}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: AppColors.surfaceMuted,
    color: AppColors.textDark,
  },
});
