import "react-native-gesture-handler";
import React from "react";
import { View, ActivityIndicator, StyleSheet, StatusBar, Platform, Image } from "react-native";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import AppNavigator from "./src/navigation/AppNavigator";
import { COLORS, FONTS } from "./src/theme/colors";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogoContainer}>
          <Image
            source={require("./assets/App_Front_Logo.png")}
            style={styles.splashLogoImage}
            resizeMode="contain"
          />
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.splashLoader} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {user ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  React.useEffect(() => {
    if (Platform.OS !== "web") {
      try {
        GoogleSignin.configure({
          webClientId: "319787442541-c89jrk04vkl1o77i21do3gcro83sfooi.apps.googleusercontent.com",
          offlineAccess: true,
        });
        console.log("[Google Sign-In] Configured successfully at startup");
      } catch (error) {
        console.error("[Google Sign-In] Startup configuration error:", error);
      }
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <AuthProvider>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
          <NavigationContainer
            theme={{
              ...DarkTheme,
              colors: {
                ...DarkTheme.colors,
                primary: COLORS.primary,
                background: COLORS.background,
                card: COLORS.card,
                text: COLORS.foreground,
                border: COLORS.border,
                notification: COLORS.primary,
              },
              fonts: {
                ...DarkTheme.fonts,
                regular: FONTS.regular,
                medium: FONTS.medium,
                bold: FONTS.bold,
                heavy: FONTS.black,
              },
            }}
          >
            <RootNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
    ...(Platform.OS === "web" && { minHeight: "100vh" }),
  },
  splash: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogoContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  splashLogoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },
  splashLoader: {
    marginTop: 24,
  },
});
