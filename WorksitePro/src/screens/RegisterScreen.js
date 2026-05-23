import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import { signInWithGoogle } from "../services/firebaseAuth";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import FuturisticButton from "../components/FuturisticButton";
import GlowingInput from "../components/GlowingInput";
import StatusBadge from "../components/StatusBadge";

const ROLES = [
  { id: "Owner", icon: "domain", label: "Owner" },
  { id: "Admin", icon: "shield-account", label: "Admin" },
  { id: "Worker", icon: "hard-hat", label: "Worker" },
];

const WORKER_TYPES = ["Labour", "Mistri", "Satring-Labour", "Satring-Mistri"];

export default function RegisterScreen({ route, navigation }) {
  const params = route.params || {};
  const [googleAuth, setGoogleAuth] = useState({
    idToken: params.idToken || "",
    email: params.email || "",
    name: params.name || "",
  });

  const [formData, setFormData] = useState({
    name: params.name || "",
    phone: "",
    role: "",
    workerType: "",
    inviteCode: "",
  });

  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);

  const googleAccounts = [
    { name: "Ankur", email: "ankursh121@gmail.com", avatar: "A", color: "#4285F4" },
    { name: "Worksite Owner", email: "testowner@example.com", avatar: "W", color: "#34A853" },
    { name: "Test User", email: "testuser@example.com", avatar: "T", color: "#EA4335" },
  ];

  // Sync route params to state if they change
  useEffect(() => {
    if (params.idToken) {
      setGoogleAuth({
        idToken: params.idToken,
        email: params.email || "",
        name: params.name || "",
      });
      setFormData((prev) => ({
        ...prev,
        name: prev.name || params.name || "",
      }));
    }
  }, [params.idToken, params.email, params.name]);

  const handleVerifyGoogleClick = () => {
    if (Platform.OS === "web") {
      executeVerifyGoogle(null);
    } else {
      setInputEmail("");
      setShowCustomEmailInput(false);
      setEmailModalVisible(true);
    }
  };

  const executeVerifyGoogle = async (customEmail = null) => {
    setLoading(true);
    try {
      const result = await signInWithGoogle(customEmail);
      setGoogleAuth(result);
      setFormData((prev) => ({
        ...prev,
        name: prev.name || result.name || "",
      }));
      Alert.alert("Verified", `Google Identity verified: ${result.email}`);
    } catch (e) {
      if (e.message && e.message.toLowerCase().includes("cancelled")) return;
      Alert.alert("Verification Failed", e.message || "Failed to authenticate Google identity");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!googleAuth.idToken) {
      return Alert.alert("Required", "Please link your Google identity first.");
    }
    if (!formData.name.trim()) {
      return Alert.alert("Required", "Please enter your full name.");
    }
    if (formData.phone.length < 10) {
      return Alert.alert("Required", "Please enter a valid 10-digit phone number.");
    }
    if (!formData.role) {
      return Alert.alert("Required", "Please assign a role to this account.");
    }
    if (formData.role === "Worker" && !formData.workerType) {
      return Alert.alert("Required", "Please select worker designation.");
    }

    setLoading(true);
    try {
      const registrationPayload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        workerType: formData.workerType,
        inviteCode: formData.inviteCode.trim(),
      };

      await login(googleAuth.idToken, registrationPayload);
      Alert.alert("Success", "Registration complete!");
    } catch (e) {
      Alert.alert(
        "Registration Failed",
        e.response?.data?.message || e.message || "An error occurred during registration."
      );
    } finally {
      setLoading(false);
    }
  };

  const isGoogleLinked = !!googleAuth.idToken;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.foreground} />
            </TouchableOpacity>
            <View style={styles.headerTitleBox}>
              <Text style={styles.title}>Register Account</Text>
              <Text style={styles.subtitle}>Set up your profile to join the team.</Text>
            </View>
          </View>

          {/* Google Identity Verification Card */}
          <GlassCard level={isGoogleLinked ? 2 : 1} style={[styles.identityCard, isGoogleLinked && styles.identityCardVerified]}>
            <View style={styles.identityHeader}>
              <Ionicons
                name={isGoogleLinked ? "checkmark-circle" : "warning"}
                size={22}
                color={isGoogleLinked ? COLORS.green : COLORS.orange}
              />
              <Text style={styles.identityTitle}>
                {isGoogleLinked ? "Google Identity Linked" : "Google Verification"}
              </Text>
            </View>
            
            {isGoogleLinked ? (
              <View style={styles.identityDetails}>
                <Text style={styles.identityText}>Email: {googleAuth.email}</Text>
                <StatusBadge color={COLORS.green} bgColor={COLORS.greenLight} style={styles.badge}>
                  VERIFIED
                </StatusBadge>
              </View>
            ) : (
              <View style={styles.identityActions}>
                <Text style={styles.identitySubtext}>
                  To secure your account, we authenticate all profiles via Google.
                </Text>
                <FuturisticButton
                  variant="primary"
                  onPress={handleVerifyGoogleClick}
                  disabled={loading}
                  icon={<Ionicons name="logo-google" size={16} color="#fff" />}
                  style={styles.verifyBtn}
                >
                  Verify Google Account
                </FuturisticButton>
              </View>
            )}
          </GlassCard>

          {/* Registration Form — active only when Google identity is verified */}
          <View 
            style={[styles.form, !isGoogleLinked && styles.formDisabled, { pointerEvents: isGoogleLinked ? "auto" : "none" }]} 
            {...(Platform.OS !== "web" ? { pointerEvents: isGoogleLinked ? "auto" : "none" } : {})}
          >
            <Text style={styles.label}>Full Name</Text>
            <GlowingInput
              icon={<Ionicons name="person" size={20} color={COLORS.mutedForeground} />}
              placeholder="e.g. Rahul Sharma"
              value={formData.name}
              onChangeText={(v) => setFormData({ ...formData, name: v })}
              editable={isGoogleLinked}
            />

            <Text style={styles.label}>Phone Number</Text>
            <GlowingInput
              icon={<Ionicons name="call" size={20} color={COLORS.mutedForeground} />}
              placeholder="10-digit number"
              keyboardType="phone-pad"
              maxLength={10}
              value={formData.phone}
              onChangeText={(v) => setFormData({ ...formData, phone: v })}
              editable={isGoogleLinked}
            />

            <Text style={styles.label}>Assign Role</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => {
                const isSelected = formData.role === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[styles.roleCard, isSelected && styles.roleCardActive]}
                    onPress={() => setFormData({ ...formData, role: r.id, workerType: "" })}
                    disabled={!isGoogleLinked}
                  >
                    <MaterialCommunityIcons
                      name={r.icon}
                      size={26}
                      color={isSelected ? COLORS.primary : COLORS.mutedForeground}
                    />
                    <Text style={[styles.roleLabel, isSelected && styles.roleLabelActive]}>
                      {r.label}
                    </Text>
                    {isSelected && <View style={styles.roleDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {formData.role === "Worker" && (
              <>
                <Text style={styles.label}>Worker Designation</Text>
                <View style={styles.typeGrid}>
                  {WORKER_TYPES.map((t) => {
                    const isSelected = formData.workerType === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeBtn, isSelected && styles.typeBtnActive]}
                        onPress={() => setFormData({ ...formData, workerType: t })}
                        disabled={!isGoogleLinked}
                      >
                        <Text style={[styles.typeBtnText, isSelected && styles.typeBtnTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {formData.role !== "Owner" && formData.role !== "" && (
              <>
                <Text style={styles.label}>Invite Code (Optional)</Text>
                <GlowingInput
                  icon={<Ionicons name="business" size={20} color={COLORS.mutedForeground} />}
                  placeholder="Link to an organization"
                  autoCapitalize="characters"
                  value={formData.inviteCode}
                  onChangeText={(v) => setFormData({ ...formData, inviteCode: v.toUpperCase() })}
                  editable={isGoogleLinked}
                />
              </>
            )}

            <FuturisticButton
              variant="primary"
              onPress={handleRegister}
              disabled={loading || !isGoogleLinked}
              icon={<Ionicons name="checkmark-circle" size={20} color="#fff" />}
              style={styles.submitBtn}
            >
              Complete Registration
            </FuturisticButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={emailModalVisible}
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <GlassCard level={3} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Ionicons name="logo-google" size={28} color={COLORS.primary} />
              <Text style={styles.modalTitle}>Choose an account</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              to continue to Worksite Pro
            </Text>

            {!showCustomEmailInput ? (
              <View style={{ width: "100%", marginVertical: 12 }}>
                {googleAccounts.map((account, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.accountRow}
                    onPress={() => {
                      setEmailModalVisible(false);
                      executeVerifyGoogle(account.email);
                    }}
                  >
                    <View style={[styles.avatarCircle, { backgroundColor: account.color }]}>
                      <Text style={styles.avatarText}>{account.avatar}</Text>
                    </View>
                    <View style={styles.accountDetails}>
                      <Text style={styles.accountName}>{account.name}</Text>
                      <Text style={styles.accountEmail}>{account.email}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255, 255, 255, 0.3)" />
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.accountRow, { borderBottomWidth: 0, marginTop: 8 }]}
                  onPress={() => setShowCustomEmailInput(true)}
                >
                  <View style={[styles.avatarCircle, { backgroundColor: "rgba(255, 255, 255, 0.1)" }]}>
                    <Ionicons name="person-add-outline" size={20} color="#fff" />
                  </View>
                  <View style={styles.accountDetails}>
                    <Text style={[styles.accountName, { color: COLORS.primary }]}>Use another account</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ width: "100%" }}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. email@gmail.com"
                  placeholderTextColor="rgba(255, 255, 255, 0.4)"
                  value={inputEmail}
                  onChangeText={setInputEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.modalBtnCancel]} 
                    onPress={() => setShowCustomEmailInput(false)}
                  >
                    <Text style={styles.modalBtnTextCancel}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.modalBtnConfirm]} 
                    onPress={() => {
                      if (!inputEmail || !inputEmail.includes("@")) {
                        Alert.alert("Validation Error", "Please enter a valid email address.");
                        return;
                      }
                      setEmailModalVisible(false);
                      executeVerifyGoogle(inputEmail.trim());
                    }}
                  >
                    <Text style={styles.modalBtnTextConfirm}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!showCustomEmailInput && (
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnCancel, { width: "100%" }]} 
                  onPress={() => setEmailModalVisible(false)}
                >
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 28 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(26,26,36,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  headerTitleBox: {
    flex: 1,
  },
  title: { color: COLORS.foreground, fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { color: COLORS.mutedForeground, fontSize: 13, marginTop: 2 },
  
  identityCard: {
    marginBottom: 24,
  },
  identityCardVerified: {
    borderColor: "rgba(34,197,94,0.3)",
  },
  identityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  identityTitle: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  identityDetails: {
    paddingLeft: 30,
    gap: 8,
  },
  identityText: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: "600",
  },
  badge: {
    marginTop: 4,
  },
  identityActions: {
    paddingLeft: 30,
    gap: 12,
  },
  identitySubtext: {
    color: COLORS.mutedForeground,
    fontSize: 13,
    lineHeight: 18,
  },
  verifyBtn: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  form: { gap: 6 },
  formDisabled: {
    opacity: 0.35,
  },
  label: { 
    color: COLORS.accentForeground, 
    fontSize: 11, 
    fontWeight: "800", 
    marginTop: 12, 
    marginBottom: 6,
    letterSpacing: 1, 
    textTransform: "uppercase" 
  },
  roleGrid: { flexDirection: "row", gap: 12, marginBottom: 8 },
  roleCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    gap: 6,
    position: "relative",
  },
  roleCardActive: { 
    borderColor: COLORS.primary, 
    backgroundColor: "rgba(124, 111, 247, 0.1)" 
  },
  roleLabel: { color: COLORS.mutedForeground, fontSize: 13, fontWeight: "800" },
  roleLabelActive: { color: COLORS.primary },
  roleDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  typeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    backgroundColor: "rgba(26, 26, 36, 0.6)",
  },
  typeBtnActive: { 
    borderColor: COLORS.primary, 
    backgroundColor: COLORS.primary 
  },
  typeBtnText: { color: COLORS.mutedForeground, fontWeight: "800", fontSize: 13 },
  typeBtnTextActive: { color: "#fff" },
  submitBtn: {
    marginTop: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 15, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 340,
    padding: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: "rgba(124, 111, 247, 0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    color: COLORS.foreground,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnCancel: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalBtnTextCancel: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "700",
  },
  modalBtnTextConfirm: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  accountDetails: {
    flex: 1,
    marginLeft: 12,
  },
  accountName: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  accountEmail: {
    color: COLORS.mutedForeground,
    fontSize: 12,
  },
});
