import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  Image,
  TouchableOpacity,
} from "react-native";
import API from "../services/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";

export default function WorkerDashboardScreen({ navigation }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ totalEarned: 0, totalPaid: 0, pendingAmount: 0, daysPresent: 0 });
  const [history, setHistory] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, attRes, payRes] = await Promise.all([
        API.get("/workers/summary"),
        API.get("/workers/attendance"),
        API.get("/workers/payments")
      ]);
      if (sumRes.data.success) setSummary(sumRes.data.data);
      
      const combined = [
        ...(attRes.data.success ? attRes.data.data.map(a => ({ ...a, type: 'attendance' })) : []),
        ...(payRes.data.success ? payRes.data.data.map(p => ({ ...p, type: 'payment', date: p.createdAt })) : [])
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(combined.slice(0, 10));
    } catch (e) {
      Alert.alert("Sync Error", "Unable to update activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Gathering Worker Profile..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.title}>My Dashboard</Text>
            {user?.owner?.name ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                Contractor: {user.owner.name}
              </Text>
            ) : (
              <Text style={styles.subtitle}>Track your earnings and attendance.</Text>
            )}
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
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <GlassCard level={2} style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>TOTAL EARNED</Text>
            <Text style={styles.heroValue}>₹{summary.totalEarned.toLocaleString()}</Text>
            <Text style={styles.heroSub}>Gross lifetime wages</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="wallet" size={28} color="#fff" />
          </View>
        </GlassCard>

        {/* Mini Stats */}
        <View style={styles.miniStats}>
          <GlassCard level={2} style={styles.miniCard}>
            <Ionicons name="time-outline" size={22} color={COLORS.orange} style={styles.miniIcon} />
            <Text style={styles.miniLabel}>Dues (Pending)</Text>
            <Text style={[styles.miniValue, { color: COLORS.orange }]}>₹{summary.pendingAmount.toLocaleString()}</Text>
          </GlassCard>
          <GlassCard level={2} style={styles.miniCard}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.blue} style={styles.miniIcon} />
            <Text style={styles.miniLabel}>Days Present</Text>
            <Text style={[styles.miniValue, { color: COLORS.blue }]}>{summary.daysPresent}</Text>
          </GlassCard>
        </View>

        {/* Recent Activity */}
        <GlassCard level={1} style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>

          {history.length > 0 ? (
            <View style={styles.activityList}>
              {history.map((item) => {
                const isAttendance = item.type === 'attendance';
                const indicatorColor = isAttendance ? COLORS.green : COLORS.primary;
                return (
                  <View key={item._id} style={styles.actRow}>
                    <View style={[styles.actBar, { backgroundColor: indicatorColor }]} />
                    <View style={styles.actInfo}>
                      <Text style={styles.actDate}>
                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                      <Text style={[styles.actStatus, { color: indicatorColor }]}>
                        {item.workerId?.name ? `${item.workerId.name} • ` : ""}
                        {isAttendance ? 'Work Session' : 'Payment Received'}
                      </Text>
                    </View>
                    <View style={styles.actRight}>
                      <Text style={styles.actAmount}>
                        {isAttendance ? (item.siteId?.name || "On-Site") : `₹${item.paidAmount}`}
                      </Text>
                      <View style={styles.actBadge}>
                        <Text style={styles.actBadgeText}>
                          {isAttendance ? `${item.hoursWorked} Hours` : item.remark || 'Direct Transfer'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.emptyText}>No recent activity found.</Text>
          )}
        </GlassCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
    alignItems: "center",
  },
  title: { color: COLORS.foreground, fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: COLORS.mutedForeground, fontSize: 14, marginTop: 2 },
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
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.full,
  },
  heroCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "rgba(124, 111, 247, 0.2)",
    borderColor: "rgba(124, 111, 247, 0.4)",
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 0,
  },
  heroLeft: {},
  heroLabel: { color: COLORS.foreground, fontSize: 11, fontWeight: "800", marginBottom: 6, letterSpacing: 1.5 },
  heroValue: { color: "#fff", fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  heroSub: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 4, fontWeight: "600" },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  miniStats: { flexDirection: "row", gap: 14, marginHorizontal: 24, marginBottom: 16 },
  miniCard: {
    flex: 1,
    padding: 0,
  },
  miniIcon: { marginBottom: 8 },
  miniLabel: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  miniValue: { fontSize: 22, fontWeight: "900" },
  sectionCard: {
    marginHorizontal: 24,
    padding: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  sectionTitle: { color: COLORS.foreground, fontSize: 16, fontWeight: "800" },
  activityList: {
    gap: 12,
  },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: RADIUS.lg,
    overflow: "hidden",
  },
  actBar: { width: 4, height: "100%", minHeight: 60 },
  actInfo: { flex: 1, paddingVertical: 12, paddingLeft: 14 },
  actDate: { color: COLORS.foreground, fontSize: 14, fontWeight: "800" },
  actStatus: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  actRight: { paddingRight: 14, alignItems: "flex-end", justifyContent: "center" },
  actAmount: { color: COLORS.foreground, fontSize: 14, fontWeight: "800" },
  actBadge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  actBadgeText: { color: COLORS.mutedForeground, fontSize: 9, fontWeight: "700" },
  emptyText: {
    color: COLORS.mutedForeground,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
});
