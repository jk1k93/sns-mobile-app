import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { requestLoginOtp, verifyOtp } from "@/api/auth";
import { OtpVerifySheet } from "@/components/otp-verify-sheet";
import { useAuth } from "@/contexts/auth-context";
import { PHONE_DIGIT_LENGTH, PhoneInput } from "@/components/ui/phone-input";
import { PrimaryButton } from "@/components/ui/primary-button";
import { AppColors } from "@/constants/app-colors";
import { ApiError } from "@/lib/api";

function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState("");
  const [otpSheetOpen, setOtpSheetOpen] = useState(false);
  const [otpSession, setOtpSession] = useState(0);
  const [otp, setOtp] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const canProceed = phone.length === PHONE_DIGIT_LENGTH;

  const loginMutation = useMutation({
    mutationFn: (phoneNumber: string) => requestLoginOtp(phoneNumber),
    onMutate: () => {
      setLoginError(null);
    },
    onError: (err: unknown) => {
      setLoginError(loginErrorMessage(err));
    },
  });

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp(phone, otp),
    onMutate: () => {
      setVerifyError(null);
    },
    onSuccess: async (data) => {
      await signIn({
        token: data.token,
        user: data.user,
        newUser: data.newUser,
      });
      setOtpSheetOpen(false);
      setOtp("");
    },
    onError: (err: unknown) => {
      setVerifyError(loginErrorMessage(err));
    },
  });

  useEffect(() => {
    setLoginError(null);
    setVerifyError(null);
    setOtpSheetOpen(false);
    setOtp("");
  }, [phone]);

  useEffect(() => {
    setVerifyError(null);
  }, [otp]);

  const handlePhoneProceed = () => {
    setOtpSession((s) => s + 1);
    setOtp("");
    setLoginError(null);
    setOtpSheetOpen(true);
    loginMutation.mutate(phone);
  };

  const handleOtpProceed = () => {
    verifyMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.welcome}>Welcome to</Text>
              <Text style={styles.brand}>SPORTSNSTATS</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Get Started !</Text>
            <Text style={styles.cardSubtitle}>
              Enter your phone number to receive an OTP for proceeding securely
            </Text>

            <PhoneInput
              value={phone}
              onChangeText={setPhone}
              style={styles.phoneField}
              autoComplete="tel"
            />

            <PrimaryButton
              title="Proceed"
              disabled={!canProceed}
              loading={loginMutation.isPending && !otpSheetOpen}
              onPress={handlePhoneProceed}
            />
            {loginError && !otpSheetOpen ? (
              <Text
                style={[styles.feedback, styles.feedbackError]}
                accessibilityLiveRegion="polite"
              >
                {loginError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <OtpVerifySheet
        visible={otpSheetOpen}
        resetKey={otpSession}
        loginError={loginError}
        isLoginPending={loginMutation.isPending}
        otp={otp}
        onOtpChange={setOtp}
        onResend={() => {
          setVerifyError(null);
          loginMutation.mutate(phone);
        }}
        isResendPending={loginMutation.isPending}
        verifyError={verifyError}
        onClose={() => setOtpSheetOpen(false)}
        onProceed={handleOtpProceed}
        isProceedPending={verifyMutation.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: AppColors.white,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  header: {
    minHeight: 280,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 48,
    backgroundColor: AppColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextBlock: {
    zIndex: 1,
    alignItems: "center",
  },
  welcome: {
    color: AppColors.white,
    fontSize: 18,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  brand: {
    marginTop: 8,
    color: AppColors.white,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  card: {
    flex: 1,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    backgroundColor: AppColors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 2,
    borderTopColor: AppColors.primaryDark,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: AppColors.primary,
    marginBottom: 10,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textMuted,
    marginBottom: 24,
  },
  phoneField: {
    marginBottom: 18,
  },
  feedback: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackError: {
    color: AppColors.error,
  },
});
