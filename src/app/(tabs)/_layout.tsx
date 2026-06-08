import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import React from "react";

import { CustomTabBar } from "@/components/custom-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { flex: 1 },
      }}
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
    />
  );
}
