import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";

const StatCard = ({ title, value, iconName, iconColor, bgColor, description }) => (
  <GlassCard level={2} style={styles.statCard}>
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {description && <Text style={styles.statDesc}>{description}</Text>}
      </View>
      <View style={[styles.statIconBox, { backgroundColor: bgColor, borderColor: iconColor }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
    </View>
  </GlassCard>
);

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    summary: { totalWorkers: 0, totalLabours: 0, totalMistris: 0, totalAdmins: 0, activeSites: 0, attendanceToday: 0, totalPaid: 0, totalDue: 0 },
    siteStats: [],
    recentActivity: [],
    weeklyTrend: [],
    owner: {},
  });

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

  useEffect(() => { fetchData(); }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "GOOD MORNING";
    if (h < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  const copyCode = () => {
    if (data.owner?.inviteCode) {
      Clipboard.setString(data.owner.inviteCode);
      Alert.alert("Copied!", "Invite code copied to clipboard.");
    }
  };

  if (loading) {
    return (
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Syncing Command Center..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingRow}>
              <MaterialCommunityIcons name="lightning-bolt" size={14} color={COLORS.primary} />
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <Text style={styles.heroName} numberOfLines={1}>
              {data.owner?.name?.split(" ")[0] || user?.name?.split(" ")[0]}
            </Text>
            <Text style={styles.heroSub} numberOfLines={2}>
              Monitoring <Text style={styles.bold}>{data.summary.activeSites} active sites</Text> today.
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate("Profile")}
            activeOpacity={0.8}
          >
            {user?.photo ? (
              <Image source={{ uri: user.photo }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileInitials}>
                <Text style={styles.profileText}>
                  {(data.owner?.name || user?.name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Small Invite Code Badge in Header */}
        <TouchableOpacity style={styles.miniInviteBadge} onPress={copyCode} activeOpacity={0.8}>
           <Ionicons name="people-outline" size={14} color={COLORS.primary} />
           <Text style={styles.miniInviteText}>Invite Code: {data.owner?.inviteCode || "—"}</Text>
           <Ionicons name="copy-outline" size={13} color={COLORS.primary} style={{ marginLeft: 2 }} />
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Workforce"
            value={data.summary.totalWorkers}
            iconName="people"
            iconColor={COLORS.blue}
            bgColor={COLORS.blueLight}
            description={`Labours: ${data.summary.totalLabours || 0}  •  Mistris: ${data.summary.totalMistris || 0}`}
          />
          <StatCard
            title="Active Admins"
            value={data.summary.totalAdmins || 0}
            iconName="shield-checkmark"
            iconColor={COLORS.primary}
            bgColor={COLORS.primaryLight}
            description="Total active organization admins"
          />
          <StatCard
            title="Site Check-ins"
            value={data.summary.attendanceToday}
            iconName="calendar-outline"
            iconColor={COLORS.green}
            bgColor={COLORS.greenLight}
            description="Today's live attendance"
          />
          <StatCard
            title="Capital Disbursed"
            value={`₹${(data.summary.totalPaid || 0).toLocaleString()}`}
            iconName="wallet-outline"
            iconColor={COLORS.purple}
            bgColor={COLORS.purpleLight}
            description="Total settled payroll payments"
          />
          <StatCard
            title="Outstanding Dues"
            value={`₹${(data.summary.totalDue || 0).toLocaleString()}`}
            iconName="cash-outline"
            iconColor={COLORS.orange}
            bgColor={COLORS.orangeLight}
            description="Total outstanding active payables"
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: { 
    padding: 24, 
    paddingBottom: 8,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerLeft: { flex: 1, gap: 2 },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    padding: 2,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
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
    fontWeight: "900",
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  greeting: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
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
    marginTop: 2,
  },
  bold: { color: COLORS.foreground, fontWeight: "800" },
  miniInviteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "rgba(124, 111, 247, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(124, 111, 247, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    alignSelf: "flex-start",
  },
  miniInviteText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  statsGrid: { padding: 16, paddingHorizontal: 24, gap: 14 },
  statCard: {
    padding: 0,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLeft: {
    flex: 1,
    paddingRight: 12,
  },
  statTitle: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
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
    marginTop: 4,
    fontWeight: "500",
  },
  statIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.full,
  },
});
