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
import { COLORS, RADIUS, SHADOW } from "../theme/colors";
import API from "../services/api";

const ROLES = [
  { id: "Owner", icon: "domain", label: "Owner" },
  { id: "Admin", icon: "shield-account", label: "Admin" },
  { id: "Worker", icon: "hard-hat", label: "Worker" },
];

const WORKER_TYPES = ["Labour", "Mistri", "Satring-Labour", "Satring-Mistri"];

export default function RegisterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "",
    workerType: "",
    inviteCode: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const { completeAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!formData.name) return Alert.alert("Required", "Please enter full name.");
    if (formData.phone.length < 10) return Alert.alert("Required", "Enter a valid 10-digit phone number.");
    if (!formData.role) return Alert.alert("Required", "Please select a role.");
    if (formData.role === "Worker" && !formData.workerType) return Alert.alert("Required", "Select worker designation.");

    setLoading(true);
    try {
      const res = await API.post("/auth/send-otp", {
        phone: formData.phone,
        isRegistration: true,
      });
      if (res.data.success) {
        setStep(2);
        Alert.alert("OTP Sent", `An OTP has been sent to +91 ${formData.phone}`);
      }
    } catch (e) {
      Alert.alert("Error", typeof e === "string" ? e : e?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (otp.length < 6) return Alert.alert("Invalid", "Please enter the 6-digit OTP.");
    
    setLoading(true);
    try {
      const payload = { ...formData, otp };
      const res = await API.post("/auth/verify-otp", payload);
      
      if (res.data.success) {
        await completeAuth(res.data.data.user, res.data.data.accessToken);
        Alert.alert("Success", "Registration complete!");
      }
    } catch (e) {
      Alert.alert("Error", typeof e === "string" ? e : e?.message || "Registration failed");
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
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.foreground} />
            </TouchableOpacity>
            <View>
              <Text style={styles.title}>Onboard Worker</Text>
              <Text style={styles.subtitle}>Register a new account on Worksite Pro.</Text>
            </View>
          </View>

          {step === 1 ? (
            <View style={styles.form}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person" size={20} color={COLORS.mutedForeground} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor={COLORS.mutedForeground}
                  value={formData.name}
                  onChangeText={(v) => setFormData({ ...formData, name: v })}
                />
              </View>

              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call" size={20} color={COLORS.mutedForeground} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="10-digit number"
                  placeholderTextColor={COLORS.mutedForeground}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={formData.phone}
                  onChangeText={(v) => setFormData({ ...formData, phone: v })}
                />
              </View>

              <Text style={styles.label}>Assign Role</Text>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const isSelected = formData.role === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      style={[styles.roleCard, isSelected && styles.roleCardActive]}
                      onPress={() => setFormData({ ...formData, role: r.id, workerType: "" })}
                    >
                      <MaterialCommunityIcons name={r.icon} size={24} color={isSelected ? COLORS.primary : COLORS.mutedForeground} />
                      <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>{r.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {formData.role === "Worker" && (
                <>
                  <Text style={styles.label}>Worker Designation</Text>
                  <View style={styles.typeGrid}>
                    {WORKER_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeBtn, formData.workerType === t && styles.typeBtnActive]}
                        onPress={() => setFormData({ ...formData, workerType: t })}
                      >
                        <Text style={[styles.typeBtnText, formData.workerType === t && styles.typeBtnTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {formData.role !== "Owner" && (
                <>
                  <Text style={styles.label}>Invite Code (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="business" size={20} color={COLORS.mutedForeground} style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Link to an organization"
                      placeholderTextColor={COLORS.mutedForeground}
                      autoCapitalize="characters"
                      value={formData.inviteCode}
                      onChangeText={(v) => setFormData({ ...formData, inviteCode: v.toUpperCase() })}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleSendOTP}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.submitBtnText}>Verify Details</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Verification OTP</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed" size={20} color={COLORS.mutedForeground} style={styles.icon} />
                <TextInput
                  style={[styles.input, { letterSpacing: 4, fontWeight: "900", fontSize: 20 }]}
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
                <Text style={styles.editBtn}>← Edit registration details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, loading && { opacity: 0.6 }]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Text style={styles.submitBtnText}>Complete Registration</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 16, marginBottom: 32 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: { color: COLORS.foreground, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: COLORS.mutedForeground, fontSize: 14, marginTop: 4 },
  form: { gap: 8 },
  label: { color: COLORS.accentForeground, fontSize: 12, fontWeight: "700", marginTop: 8, letterSpacing: 0.5, textTransform: "uppercase" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  icon: { marginRight: 12 },
  input: { flex: 1, color: COLORS.foreground, fontSize: 16, fontWeight: "600" },
  roleGrid: { flexDirection: "row", gap: 10, marginBottom: 8 },
  roleCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    gap: 6,
  },
  roleCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  roleLabel: { color: COLORS.mutedForeground, fontSize: 12, fontWeight: "700" },
  roleLabelActive: { color: COLORS.primary },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  typeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  typeBtnText: { color: COLORS.mutedForeground, fontWeight: "700", fontSize: 13 },
  typeBtnTextActive: { color: "#fff" },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    ...SHADOW.primary,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  editBtn: { color: COLORS.primary, fontWeight: "700", fontSize: 13, marginBottom: 16 },
});
