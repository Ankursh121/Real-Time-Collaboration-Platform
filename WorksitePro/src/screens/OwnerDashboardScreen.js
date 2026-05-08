import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

const StatCard = ({ title, value, iconName, iconColor, bgColor, description }) => (
  <View style={[styles.statCard, { borderLeftColor: iconColor, borderLeftWidth: 3 }]}>
    <View style={styles.statRow}>
      <View>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {description && <Text style={styles.statDesc}>{description}</Text>}
      </View>
      <View style={[styles.statIconBox, { backgroundColor: bgColor }]}>
        <Ionicons name={iconName} size={24} color={iconColor} />
      </View>
    </View>
  </View>
);

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalWorkers: 0, activeSites: 0, attendanceToday: 0, totalPaid: 0, totalDue: 0 },
    siteStats: [],
    recentActivity: [],
    weeklyTrend: [],
    owner: {},
  });
  
  // Site Creation State
  const [isSiteModalVisible, setSiteModalVisible] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", location: "", description: "" });
  const [creatingSite, setCreatingSite] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/owners/dashboard");
      if (res.data.success) setData(res.data.data);
    } catch {
      Alert.alert("Sync Failed", "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };


  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.location) {
      return Alert.alert("Missing Info", "Site name and location are required.");
    }

    try {
      setCreatingSite(true);
      const res = await API.post("/sites", newSite);
      if (res.data.success) {
        Alert.alert("Success", "New site established successfully!");
        setSiteModalVisible(false);
        setNewSite({ name: "", location: "", description: "" });
        fetchData(); // Refresh dashboard
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to create site.");
    } finally {
      setCreatingSite(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const copyCode = () => {
    if (data.owner?.inviteCode) {
      Clipboard.setString(data.owner.inviteCode);
      Alert.alert("Copied!", "Invite code copied to clipboard.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Assembling Command Center...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color={COLORS.primary} />
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <Text style={styles.heroName} numberOfLines={1}>
              {data.owner?.name?.split(" ")[0] || user?.name?.split(" ")[0]}
            </Text>
            <Text style={styles.heroSub} numberOfLines={2}>
              Monitoring <Text style={styles.bold}>{data.summary.activeSites} sites</Text> today.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
          >
            <View style={styles.profileInitials}>
              <Text style={styles.profileText}>
                {(data.owner?.name || user?.name || "U").charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Small Invite Code Badge in Header or Stats? */}
        {/* Keeping it for now but making it smaller */}
        <TouchableOpacity style={styles.miniInviteBadge} onPress={copyCode} activeOpacity={0.8}>
           <Text style={styles.miniInviteText}>Invite Code: {data.owner?.inviteCode || "—"}</Text>
           <Ionicons name="copy" size={14} color={COLORS.primary} />
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Workforce"
            value={data.summary.totalWorkers}
            iconName="people"
            iconColor={COLORS.blue}
            bgColor={COLORS.blueLight}
            description="Total vetted workers"
          />
          <StatCard
            title="Site Check-ins"
            value={data.summary.attendanceToday}
            iconName="calendar-outline"
            iconColor={COLORS.green}
            bgColor={COLORS.greenLight}
            description="Today's attendance"
          />
          <StatCard
            title="Capital Disbursed"
            value={`₹${(data.summary.totalPaid || 0).toLocaleString()}`}
            iconName="wallet-outline"
            iconColor={COLORS.purple}
            bgColor={COLORS.purpleLight}
            description="Total payroll settled"
          />
          <StatCard
            title="Outstanding Dues"
            value={`₹${(data.summary.totalDue || 0).toLocaleString()}`}
            iconName="cash-outline"
            iconColor={COLORS.orange}
            bgColor={COLORS.orangeLight}
            description="Active payables"
          />

        </View>

        {/* Managed Sites Section - Removed as it is now a dedicated tab */}
      </ScrollView>

      {/* Site Creation Modal */}
      <Modal
        visible={isSiteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSiteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Construction Site</Text>
              <TouchableOpacity onPress={() => setSiteModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Site Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Skyline Towers"
                placeholderTextColor={COLORS.mutedForeground}
                value={newSite.name}
                onChangeText={(v) => setNewSite({ ...newSite, name: v })}
              />

              <Text style={styles.inputLabel}>Location / City</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Mumbai, Sector 4"
                placeholderTextColor={COLORS.mutedForeground}
                value={newSite.location}
                onChangeText={(v) => setNewSite({ ...newSite, location: v })}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: "top" }]}
                placeholder="Details about the project..."
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                value={newSite.description}
                onChangeText={(v) => setNewSite({ ...newSite, description: v })}
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, creatingSite && { opacity: 0.7 }]}
                onPress={handleCreateSite}
                disabled={creatingSite}
              >
                {creatingSite ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.modalSubmitText}>Establish Site</Text>
                    <Ionicons name="business" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  loader: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loaderText: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 12,
  },
  header: { 
    padding: 24, 
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerLeft: { flex: 1, gap: 4 },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
    padding: 2,
    ...SHADOW.sm,
  },
  profileInitials: {
    flex: 1,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  greeting: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroName: {
    color: COLORS.foreground,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  heroSub: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  bold: { color: COLORS.foreground, fontWeight: "700" },
  miniInviteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 12,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
  },
  miniInviteText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  inviteCard: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    borderWidth: 1,
    borderColor: COLORS.primary + "40",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOW.primary,
  },
  inviteLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  inviteCode: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: "900",
    fontFamily: Platform?.OS === "ios" ? "Courier" : "monospace",
    letterSpacing: 4,
  },
  inviteIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: { padding: 16, paddingHorizontal: 24, gap: 12 },
  statCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statTitle: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  statDesc: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    marginTop: 2,
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  section: {
    marginHorizontal: 24,
    marginTop: 24,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  siteCard: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  siteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  siteName: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  siteMeta: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    marginTop: 2,
  },
  siteCountBadge: {
    backgroundColor: COLORS.blueLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  siteCountText: {
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: "800",
  },
  progressContainer: {
    gap: 8,
  },
  pctText: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "right",
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.mutedForeground,
    fontSize: 13,
    textAlign: "center",
  },
  siteRow: { marginBottom: 16 },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  activityContent: { flex: 1 },
  activityUser: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: "700",
  },
  activityLabel: { color: COLORS.mutedForeground, fontWeight: "400" },
  activityMeta: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    ...SHADOW.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  form: { gap: 16 },
  inputLabel: {
    color: COLORS.accentForeground,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: -8,
  },
  modalInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "600",
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    ...SHADOW.primary,
  },
});
