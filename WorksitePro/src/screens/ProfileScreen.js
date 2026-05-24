import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import API from "../services/api";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import FuturisticButton from "../components/FuturisticButton";
import StatusBadge from "../components/StatusBadge";

const ROLE_COLORS = {
  Owner: "#a855f7", // purple
  Admin: "#3b82f6", // blue
  Worker: "#22c55e", // green
};

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);

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

  const selectImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access library is required to upload a profile photo.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        await uploadImage(selectedAsset.uri);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to select image");
    }
  };

  const uploadImage = async (uri) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append("photo", blob, "profile.jpg");
      } else {
        const uriParts = uri.split('.');
        const fileType = uriParts[uriParts.length - 1] || 'jpg';
        formData.append("photo", {
          uri,
          name: `profile.${fileType}`,
          type: `image/${fileType}`,
        });
      }

      const res = await API.patch("/auth/photo", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        Alert.alert("Success", "Profile photo updated successfully!");
        setUser(res.data.data);
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Upload Failed", error.response?.data?.message || "Could not upload profile photo.");
    } finally {
      setUploading(false);
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
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Avatar Card */}
        <GlassCard level={2} style={styles.avatarCard}>
          <TouchableOpacity 
            style={[styles.avatarCircle, { backgroundColor: roleColor + "20", borderColor: roleColor }]}
            onPress={selectImage}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color={roleColor} size="small" />
            ) : user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: roleColor }]}>
                {(user?.name?.[0] || "?").toUpperCase()}
              </Text>
            )}
            <View style={styles.editIconBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{user?.name}</Text>
          <StatusBadge color={roleColor} bgColor={roleColor + "15"} style={styles.badge}>
            {user?.role?.toUpperCase()}
          </StatusBadge>
        </GlassCard>

        {/* Info Items */}
        <GlassCard level={2} style={styles.card}>
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
        </GlassCard>

        {/* Subscription (Owner only) */}
        {user?.role === "Owner" && (
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Subscription")}
          >
            <GlassCard level={2} style={[styles.card, styles.interactiveCard]}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardTitle}>Subscription Plan</Text>
                  <Text style={styles.planText}>Manage your active plan and billing details</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* Invite Code (Owner only) */}
        {user?.inviteCode && (
          <GlassCard level={2} style={styles.card}>
            <Text style={styles.cardTitle}>Invite Code</Text>
            <Text style={styles.inviteCode}>{user.inviteCode}</Text>
            <Text style={styles.inviteHint}>Share this with admins and workers to join your organization.</Text>
          </GlassCard>
        )}

        {/* Logout */}
        <View style={styles.logoutContainer}>
          <FuturisticButton
            variant="glass"
            onPress={handleLogout}
            icon={<Ionicons name="log-out-outline" size={20} color={COLORS.red} />}
            style={styles.logoutBtn}
            textStyle={{ color: COLORS.red }}
          >
            Sign Out
          </FuturisticButton>
        </View>

        <Text style={styles.version}>Worksite Pro • v1.0.0</Text>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: 24, 
    paddingBottom: 12,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
  },
  pageTitle: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  avatarCard: {
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 28,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 40, fontWeight: "900" },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0f0f13",
  },
  name: {
    color: COLORS.foreground,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  badge: {
    marginTop: 4,
  },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 0,
  },
  interactiveCard: {
    borderColor: "rgba(124, 111, 247, 0.25)",
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
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(124, 111, 247, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  infoValue: { color: COLORS.foreground, fontSize: 15, fontWeight: "700" },
  inviteCode: {
    color: COLORS.primary,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 4,
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  inviteHint: { color: COLORS.mutedForeground, fontSize: 12, lineHeight: 16 },
  planText: { color: COLORS.mutedForeground, fontSize: 13, lineHeight: 18 },
  logoutContainer: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  logoutBtn: {
    borderColor: "rgba(239, 68, 68, 0.25)",
    backgroundColor: "rgba(239, 68, 68, 0.04)",
  },
  version: {
    textAlign: "center",
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 20,
  },
});
