import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppColors } from "@/constants/app-colors";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  isPending?: boolean;
  pendingText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  isPending = false,
  pendingText = "Please wait…",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={isPending}
              style={[styles.cancelBtn, isPending && styles.btnDisabled]}
            >
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={isPending}
              style={[
                styles.confirmBtn,
                destructive && styles.confirmBtnDestructive,
                isPending && styles.btnDisabled,
              ]}
            >
              <Text style={styles.confirmText}>
                {isPending ? pendingText : confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    backgroundColor: AppColors.white,
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: AppColors.textDark,
  },
  message: {
    fontSize: 14,
    color: AppColors.textMuted,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.surfaceMuted,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.textDark,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: AppColors.primary,
  },
  confirmBtnDestructive: {
    backgroundColor: AppColors.error,
  },
  confirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: AppColors.white,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
