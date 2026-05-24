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
      size={20}
      color={focused ? COLORS.primary : COLORS.mutedForeground}
    />
    <Text 
      style={[styles.tabLabel, focused && styles.tabLabelActive]}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {label}
    </Text>
  </View>
);

const OwnerTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabBarOptions(insets)}>
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="grid" {...p} label="Dash" /> }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="calendar" {...p} label="Attend" /> }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="wallet" {...p} label="Pay" /> }}
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
};

const AdminTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabBarOptions(insets)}>
      <Tab.Screen
        name="Dashboard"
        component={OwnerDashboardScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="grid" {...p} label="Dash" /> }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="calendar" {...p} label="Attend" /> }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="wallet" {...p} label="Pay" /> }}
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
};

const WorkerTabs = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator screenOptions={tabBarOptions(insets)}>
      <Tab.Screen
        name="Dashboard"
        component={WorkerDashboardScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="home" {...p} label="Home" /> }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="calendar" {...p} label="Attend" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: (p) => <TabIcon name="person" {...p} label="Profile" /> }}
      />
    </Tab.Navigator>
  );
};

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

const tabBarOptions = (insets) => {
  const bottomInset = insets?.bottom || 0;
  // Calculate paddings based on platform and safe area
  const paddingBottom = Platform.OS === "ios"
    ? (bottomInset > 0 ? bottomInset : 24)
    : (bottomInset > 0 ? bottomInset : 8);
  const height = Platform.OS === "ios"
    ? (56 + paddingBottom)
    : (60 + paddingBottom);

  return {
    headerShown: false,
    tabBarShowLabel: false,
    tabBarStyle: {
      position: "absolute",
      backgroundColor: COLORS.glassBg,
      borderTopColor: COLORS.border,
      borderTopWidth: 1,
      height: height,
      paddingBottom: paddingBottom,
      ...SHADOW.card,
    },
    tabBarItemStyle: {
      paddingTop: 8,
    },
  };
};

const styles = StyleSheet.create({
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: 2,
    paddingVertical: 4,
    borderRadius: RADIUS.lg,
  },
  tabItemActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabLabel: {
    color: COLORS.mutedForeground,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});
