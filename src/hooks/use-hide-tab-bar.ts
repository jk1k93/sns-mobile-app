import { useFocusEffect } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import { useCallback } from "react";

/** Hides the bottom tab bar while this screen is focused (e.g. full-step flows). */
export function useHideTabBarWhileFocused() {
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const tab = navigation.getParent();
      if (!tab) return;
      tab.setOptions({ tabBarStyle: { display: "none" } });
      return () => {
        tab.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation])
  );
}
