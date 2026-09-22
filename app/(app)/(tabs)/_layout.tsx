import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Tabs } from "expo-router/tabs";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fontFamilies, radius } from "../../../src/theme";
import { GlobalFab } from "../../../src/components/shell";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused ? styles.iconWrapActive : null]}>
      <MaterialIcons
        name={name}
        size={22}
        color={focused ? colors.primary : colors.textSecondary}
      />
    </View>
  );
}

export default function AppTabsLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        initialRouteName="home"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Início",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="expenses"
          options={{
            title: "Lançamentos",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="receipt-long" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="cost-plan"
          options={{
            title: "Planejamento",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="savings" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Casal",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="people" focused={focused} />
            ),
          }}
        />
      </Tabs>

      <GlobalFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: fontFamilies.inter.semibold,
    fontSize: 12,
  },
  tabItem: {
    paddingVertical: 2,
  },
  iconWrap: {
    width: 40,
    height: 26,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: colors.primarySoft,
  },
});
