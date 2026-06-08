import { useRef } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { OtpInput, type OtpInputRef } from "react-native-otp-entry";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";

export const OTP_DIGIT_COUNT = 6;

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Increment when opening the sheet so the OTP field remounts clean. */
  resetKey: number;
  loginError: string | null;
  isLoginPending: boolean;
  otp: string;
  onOtpChange: (text: string) => void;
  onResend: () => void;
  isResendPending: boolean;
  verifyError: string | null;
  onProceed: () => void;
  isProceedPending?: boolean;
};

export function OtpVerifySheet({
  visible,
  onClose,
  resetKey,
  loginError,
  isLoginPending,
  otp,
  onOtpChange,
  onResend,
  isResendPending,
  verifyError,
  onProceed,
  isProceedPending = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const otpRef = useRef<OtpInputRef>(null);

  const handleResend = () => {
    otpRef.current?.clear();
    onOtpChange("");
    onResend();
  };

  const canSubmitOtp = otp.length === OTP_DIGIT_COUNT;

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
            { paddingBottom: Math.max(insets.bottom, 20) },
          ]}
        >
          <View style={styles.handle} accessibilityLabel="Bottom sheet handle" />
          <Text style={styles.title}>Verify Your Account !</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to your mobile number
          </Text>

          {loginError ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {loginError}
            </Text>
          ) : null}
          {verifyError ? (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {verifyError}
            </Text>
          ) : null}
          {isLoginPending ? (
            <Text style={styles.status}>Sending OTP…</Text>
          ) : null}

          <OtpInput
            key={resetKey}
            ref={otpRef}
            numberOfDigits={OTP_DIGIT_COUNT}
            type="numeric"
            autoFocus={visible}
            focusColor={AppColors.primary}
            blurOnFilled
            onTextChange={onOtpChange}
            theme={otpTheme}
          />

          <View style={styles.resendRow}>
            <Text style={styles.resendPrefix}>{"Didn't receive code? "}</Text>
            <Pressable
              onPress={handleResend}
              disabled={isResendPending || isLoginPending}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.resendLink,
                  (isResendPending || isLoginPending) && styles.resendDisabled,
                ]}
              >
                Resend
              </Text>
            </Pressable>
          </View>

          <PrimaryButton
            title="Proceed"
            disabled={!canSubmitOtp || isProceedPending}
            loading={isProceedPending}
            onPress={onProceed}
            style={styles.proceed}
          />
        </View>
      </View>
    </Modal>
  );
}

const pinBox: ViewStyle = {
  width: 48,
  height: 48,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: "#CFD8DC",
  backgroundColor: AppColors.white,
};

const otpTheme = {
  containerStyle: {
    width: "auto" as const,
    gap: 8,
    marginTop: 8,
    marginBottom: 16,
    alignSelf: "center" as const,
  },
  pinCodeContainerStyle: pinBox,
  focusedPinCodeContainerStyle: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.surfaceMuted,
  },
  filledPinCodeContainerStyle: {
    borderColor: AppColors.primaryDark,
  },
  pinCodeTextStyle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: AppColors.textDark,
  },
};

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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#B0BEC5",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textMuted,
    marginBottom: 4,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.error,
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    color: AppColors.textMuted,
    marginTop: 8,
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 20,
  },
  resendPrefix: {
    fontSize: 14,
    color: AppColors.textMuted,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.primary,
  },
  resendDisabled: {
    opacity: 0.45,
  },
  proceed: {
    marginBottom: 4,
  },
});
