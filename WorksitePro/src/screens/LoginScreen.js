import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import { signInWithGoogle } from "../services/firebaseAuth";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import FuturisticButton from "../components/FuturisticButton";

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { idToken, email, name } = await signInWithGoogle();
      
      try {
        const user = await login(idToken);
        if (!user) {
          Alert.alert("Login Failed", "Could not verify your credentials.");
        }
      } catch (err) {
        const isNotRegistered = 
          err.response?.status === 404 || 
          err.message?.includes("404") || 
          err.response?.data?.message?.toLowerCase().includes("register") ||
          err.response?.data?.message?.toLowerCase().includes("not found");
          
        if (isNotRegistered) {
          if (Platform.OS === "web") {
            const setupProfile = window.confirm(
              "Account Setup Required\n\nThis Google account is not registered yet. Would you like to set up your profile?"
            );
            if (setupProfile) {
              navigation.navigate("Register", { idToken, email, name });
            }
          } else {
            Alert.alert(
              "Account Setup Required",
              "This Google account is not registered yet. Let's set up your profile.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Set Up Profile",
                  onPress: () => navigation.navigate("Register", { idToken, email, name })
                }
              ]
            );
          }
        } else {
          throw err;
        }
      }
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes("cancelled")) {
        // Log cancelled cleanly
        console.log("[Google Auth] Login cancelled by user");
        return;
      }
      Alert.alert(
        "Authentication Error",
        e.response?.data?.message || e.message || "Failed to authenticate with Google"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterLinkClick = async () => {
    setLoading(true);
    try {
      const { idToken, email, name } = await signInWithGoogle();
      navigation.navigate("Register", { idToken, email, name });
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes("cancelled")) return;
      Alert.alert("Google Auth Failed", e.message || "Failed to link Google account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand */}
          <View style={styles.brandRow}>
            <View style={styles.logo3D}>
              <View style={styles.logoFace}>
                <Text style={styles.logoText}>W</Text>
              </View>
            </View>
            <View>
              <Text style={styles.brandName}>Worksite Pro</Text>
              <Text style={styles.brandTagline}>COMMAND CENTRE</Text>
            </View>
          </View>

          {/* Headline */}
          <View style={styles.headingBox}>
            <Text style={styles.heading}>Welcome to Worksite</Text>
            <Text style={styles.subheading}>
              Connect with your team, manage tasks, and track attendance in real-time.
            </Text>
          </View>

          {/* Feature Highlight Cards */}
          <View style={styles.featureGrid}>
            <GlassCard level={2} style={styles.featureCard}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={COLORS.primary} />
              <Text style={styles.featureTitle}>Instant Setup</Text>
              <Text style={styles.featureDesc}>One-tap login using your Google account.</Text>
            </GlassCard>
            <GlassCard level={2} style={styles.featureCard}>
              <MaterialCommunityIcons name="clock-check" size={24} color={COLORS.primary} />
              <Text style={styles.featureTitle}>Easy Check-In</Text>
              <Text style={styles.featureDesc}>Log attendance and check shift schedules instantly.</Text>
            </GlassCard>
          </View>

          {/* Google Sign-in Button */}
          <FuturisticButton
            onPress={handleGoogleSignIn}
            loading={loading}
            icon={<Ionicons name="logo-google" size={20} color="#fff" />}
            style={styles.googleBtn}
          >
            Sign in with Google
          </FuturisticButton>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New worker? </Text>
            <FuturisticButton
              variant="glass"
              onPress={handleRegisterLinkClick}
              style={styles.registerBtn}
              textStyle={styles.registerBtnText}
            >
              Register with Google
            </FuturisticButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 40,
    justifyContent: "center",
    flexGrow: 1,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 48,
    alignSelf: "center",
  },
  logo3D: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(124, 111, 247, 0.2)",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: "0 0 20px rgba(124, 111, 247, 0.4)",
      },
    }),
  },
  logoFace: {
    width: "88%",
    height: "88%",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontStyle: "italic",
    fontWeight: "900",
  },
  brandName: {
    color: COLORS.foreground,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 2,
  },
  headingBox: {
    marginBottom: 40,
    alignItems: "center",
  },
  heading: {
    color: COLORS.foreground,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 12,
    textAlign: "center",
  },
  subheading: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  featureGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 48,
  },
  featureCard: {
    flex: 1,
    padding: 0,
    gap: 8,
  },
  featureTitle: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 4,
  },
  featureDesc: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
  },
  googleBtn: {
    marginTop: 8,
  },
  registerRow: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 36,
    gap: 12,
  },
  registerText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    fontWeight: "600",
  },
  registerBtn: {
    width: "100%",
  },
  registerBtnText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
