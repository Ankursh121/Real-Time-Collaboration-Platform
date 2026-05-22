import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import OwnerDashboardScreen from "../screens/OwnerDashboardScreen";
import WorkerDashboardScreen from "../screens/WorkerDashboardScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import PaymentScreen from "../screens/PaymentScreen";
import RateManagementScreen from "../screens/RateManagementScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SiteManagementScreen from "../screens/SiteManagementScreen";
import SiteDetailsScreen from "../screens/SiteDetailsScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";

import { COLORS, RADIUS, SHADOW } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const SiteStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="SiteList" component={SiteManagementScreen} />
    <Stack.Screen name="SiteDetails" component={SiteDetailsScreen} />
  </Stack.Navigator>
);

const TabIcon = ({ name, focused, label }) => (
  <View style={[styles.tabItem, focused && styles.tabItemActive]}>
    <Ionicons
      name={focused ? name : `${name}-outline`}
      size={22}
      color={focused ? COLORS.primary : COLORS.mutedForeground}
    />
    <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
      {label}
    </Text>
  </View>
);

const OwnerTabs = () => (
  <Tab.Navigator screenOptions={tabBarOptions()}>
    <Tab.Screen
      name="Dashboard"
      component={OwnerDashboardScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="grid" {...p} label="Dashboard" /> }}
    />
    <Tab.Screen
      name="Attendance"
      component={AttendanceScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="calendar" {...p} label="Attendance" /> }}
    />
    <Tab.Screen
      name="Payments"
      component={PaymentScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="wallet" {...p} label="Payments" /> }}
    />
    <Tab.Screen
      name="Rates"
      component={RateManagementScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="cash" {...p} label="Rates" /> }}
    />
    <Tab.Screen
      name="Sites"
      component={SiteStack}
      options={{ tabBarIcon: (p) => <TabIcon name="business" {...p} label="Sites" /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="person" {...p} label="Profile" /> }}
    />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator screenOptions={tabBarOptions()}>
    <Tab.Screen
      name="Dashboard"
      component={OwnerDashboardScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="grid" {...p} label="Dashboard" /> }}
    />
    <Tab.Screen
      name="Attendance"
      component={AttendanceScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="calendar" {...p} label="Attendance" /> }}
    />
    <Tab.Screen
      name="Payments"
      component={PaymentScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="wallet" {...p} label="Payments" /> }}
    />
    <Tab.Screen
      name="Sites"
      component={SiteStack}
      options={{ tabBarIcon: (p) => <TabIcon name="business" {...p} label="Sites" /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="person" {...p} label="Profile" /> }}
    />
  </Tab.Navigator>
);

const WorkerTabs = () => (
  <Tab.Navigator screenOptions={tabBarOptions()}>
    <Tab.Screen
      name="Dashboard"
      component={WorkerDashboardScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="home" {...p} label="Home" /> }}
    />
    <Tab.Screen
      name="Attendance"
      component={AttendanceScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="calendar" {...p} label="Attendance" /> }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: (p) => <TabIcon name="person" {...p} label="Profile" /> }}
    />
  </Tab.Navigator>
);

const OwnerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={OwnerTabs} />
    <Stack.Screen name="Subscription" component={SubscriptionScreen} />
  </Stack.Navigator>
);

export default function AppNavigator() {
  const { user } = useAuth();

  if (user?.role === "Owner") return <OwnerStack />;
  if (user?.role === "Admin") return <AdminTabs />;
  return <WorkerTabs />;
}

const tabBarOptions = () => ({
  headerShown: false,
  tabBarShowLabel: false,
  tabBarStyle: {
    position: "absolute",
    backgroundColor: COLORS.glassBg,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 80 : 68,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    ...SHADOW.card,
  },
  tabBarItemStyle: {
    paddingTop: 8,
  },
});

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
