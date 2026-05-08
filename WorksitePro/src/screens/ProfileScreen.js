import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

const ROLE_COLORS = {
  Owner: "#a855f7", // purple
  Admin: "#3b82f6", // blue
  Worker: "#22c55e", // green
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        logout();
      }
    } else {
      Alert.alert("Logout", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: logout },
      ]);
    }
  };

  const roleColor = ROLE_COLORS[user?.role] || COLORS.primary;

  const infoItems = React.useMemo(() => [
    { icon: "call-outline", label: "Phone", value: user?.phone },
    { icon: "shield-outline", label: "Role", value: user?.role },
    { icon: "construct-outline", label: "Worker Type", value: user?.workerType || "N/A" },
    { icon: "business-outline", label: "Organization", value: user?.ownerName || "Direct" },
  ], [user]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={[styles.avatarCircle, { backgroundColor: roleColor + "20", borderColor: roleColor + "60" }]}>
            <Text style={[styles.avatarText, { color: roleColor }]}>
              {(user?.name?.[0] || "?").toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + "15", borderColor: roleColor + "40" }]}>
            <Text style={[styles.roleBadgeText, { color: roleColor }]}>{user?.role}</Text>
          </View>
        </View>

        {/* Info Items */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>
          {infoItems.map((item, i) => (
            <View key={i} style={[styles.infoRow, i < infoItems.length - 1 && styles.infoRowBorder]}>
              <View style={styles.infoIcon}>
                <Ionicons name={item.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value || "—"}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Invite Code (Owner only) */}
        {user?.inviteCode && (
          <View style={[styles.card, { borderColor: COLORS.primary + "30" }]}>
            <Text style={styles.cardTitle}>Invite Code</Text>
            <Text style={styles.inviteCode}>{user.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share this with admins and workers to join your organization.</Text>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.red} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Worksite Pro • v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingBottom: 8 },
  pageTitle: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  avatarCard: {
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: 28,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 40, fontWeight: "900" },
  name: {
    color: COLORS.foreground,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  cardTitle: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {},
  infoLabel: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: { color: COLORS.foreground, fontSize: 15, fontWeight: "700" },
  inviteCode: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 4,
    marginBottom: 8,
  },
  inviteHint: { color: COLORS.mutedForeground, fontSize: 12 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.redLight,
    borderRadius: RADIUS.xl,
    marginHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: COLORS.red + "30",
    marginBottom: 20,
  },
  logoutText: { color: COLORS.red, fontSize: 16, fontWeight: "800" },
  version: {
    textAlign: "center",
    color: COLORS.mutedForeground,
    fontSize: 11,
    marginBottom: 20,
  },
});
