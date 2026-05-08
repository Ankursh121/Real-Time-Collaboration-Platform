import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, FONTS, RADIUS, SHADOW } from "../theme/colors";

const ROLES = [
  { id: "Owner", icon: "office-building", label: "Owner" },
  { id: "Admin", icon: "shield-account", label: "Admin" },
  { id: "Worker", icon: "hard-hat", label: "Worker" },
];

const WORKER_TYPES = ["Labour", "Mistri", "Satring-Labour", "Satring-Mistri"];

export default function LoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("");
  const [workerType, setWorkerType] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const { login, sendOTP } = useAuth();

  const handleSendOTP = async () => {
    if (!role) return Alert.alert("Select Role", "Please select your role first.");
    if (role === "Worker" && !workerType)
      return Alert.alert("Select Type", "Please select your worker designation.");
    if (phone.length < 10)
      return Alert.alert("Invalid Phone", "Enter a valid 10-digit phone number.");

    setLoading(true);
    try {
      const success = await sendOTP(phone);
      if (success) {
        setStep(2);
        Alert.alert("OTP Sent", `An OTP has been sent to ${phone}`);
      }
    } catch (e) {
      Alert.alert("Error", typeof e === "string" ? e : e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (otp.length < 6) return Alert.alert("Invalid OTP", "Please enter the 6-digit OTP.");
    setLoading(true);
    try {
      const user = await login(phone, otp, role, workerType);
      if (!user) Alert.alert("Login Failed", "Could not verify your credentials.");
    } catch (e) {
      Alert.alert("Error", typeof e === "string" ? e : e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>W</Text>
            </View>
            <View>
              <Text style={styles.brandName}>Worksite Pro</Text>
              <Text style={styles.brandTagline}>Construction Command Center</Text>
            </View>
          </View>

          {/* Headline */}
          <View style={styles.headingBox}>
            <Text style={styles.heading}>
              {step === 1 ? "Welcome Back" : "Verify OTP"}
            </Text>
            <Text style={styles.subheading}>
              {step === 1
                ? "Select your role and sign in to continue."
                : `Enter the OTP sent to +91 ${phone}`}
            </Text>
          </View>

          {step === 1 ? (
            <>
              {/* Role Selection */}
              <Text style={styles.label}>I am logging in as a...</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const isSelected = role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleCard, isSelected && styles.roleCardActive]}
                      onPress={() => { setRole(r.id); setWorkerType(""); }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={r.icon}
                        size={28}
                        color={isSelected ? COLORS.primary : COLORS.mutedForeground}
                      />
                      <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Worker Subtype */}
              {role === "Worker" && (
                <>
                  <Text style={styles.label}>Worker Designation</Text>
                  <View style={styles.typeRow}>
                    {WORKER_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeBtn, workerType === t && styles.typeBtnActive]}
                        onPress={() => setWorkerType(t)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.typeBtnText, workerType === t && styles.typeBtnTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Phone Input */}
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call" size={20} color={COLORS.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Your 10-digit number"
                  placeholderTextColor={COLORS.mutedForeground}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <Text style={styles.label}>Security OTP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color={COLORS.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor={COLORS.mutedForeground}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                  autoFocus
                />
              </View>
              <TouchableOpacity onPress={() => setStep(1)}>
                <Text style={styles.editPhone}>← Edit phone number</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={step === 1 ? handleSendOTP : handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>
                  {step === 1 ? "Secure Login" : "Verify & Enter"}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New worker? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Register here</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 36,
    marginTop: 8,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.primary,
  },
  logoText: {
    color: "#fff",
    fontSize: 26,
    fontStyle: "italic",
    fontWeight: "900",
  },
  brandName: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  brandTagline: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  headingBox: {
    marginBottom: 32,
  },
  heading: {
    color: COLORS.foreground,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    marginBottom: 6,
  },
  subheading: {
    color: COLORS.mutedForeground,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: COLORS.accentForeground,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  roleGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  roleCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 8,
  },
  roleCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
    ...SHADOW.primary,
  },
  roleLabel: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  roleLabelActive: {
    color: COLORS.primary,
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    ...SHADOW.primary,
  },
  typeBtnText: {
    color: COLORS.mutedForeground,
    fontWeight: "700",
    fontSize: 14,
  },
  typeBtnTextActive: {
    color: "#fff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "600",
  },
  otpInput: {
    letterSpacing: 6,
    fontSize: 20,
    fontWeight: "900",
  },
  editPhone: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 13,
    marginTop: -12,
    marginBottom: 24,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    ...SHADOW.primary,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  registerText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
  },
  registerLink: {
    color: COLORS.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});
