import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import API from "../services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

export default function WorkerDashboardScreen() {
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Dashboard</Text>
            <Text style={styles.subtitle}>Track your earnings and attendance.</Text>
          </View>
          {user?.owner?.name && (
            <View style={styles.ownerBadge}>
              <Ionicons name="business-outline" size={14} color={COLORS.mutedForeground} />
              <Text style={styles.ownerText}>
                Under: <Text style={styles.ownerName}>{user.owner.name}</Text>
              </Text>
            </View>
          )}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Total Earned</Text>
            <Text style={styles.heroValue}>₹{summary.totalEarned.toLocaleString()}</Text>
            <Text style={styles.heroSub}>Gross lifetime wages</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="wallet" size={32} color="#fff" />
          </View>
        </View>

        {/* Mini Stats */}
        <View style={styles.miniStats}>
          <View style={styles.miniCard}>
            <Ionicons name="time-outline" size={22} color={COLORS.orange} style={styles.miniIcon} />
            <Text style={styles.miniLabel}>Dues (Pending)</Text>
            <Text style={[styles.miniValue, { color: COLORS.orange }]}>₹{summary.pendingAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.miniCard}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.blue} style={styles.miniIcon} />
            <Text style={styles.miniLabel}>Days Present</Text>
            <Text style={[styles.miniValue, { color: COLORS.blue }]}>{summary.daysPresent}</Text>
          </View>
        </View>


        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="time" size={18} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Recent Activity</Text>
            </View>
          </View>

          {history.length > 0 ? history.map((item) => (
            <View key={item._id} style={styles.actRow}>
              <View
                style={[
                  styles.actBar,
                  { backgroundColor: item.type === 'attendance' ? COLORS.green : COLORS.primary },
                ]}
              />
              <View style={styles.actInfo}>
                <Text style={styles.actDate}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                <Text style={[styles.actStatus, { color: item.type === 'attendance' ? COLORS.green : COLORS.primary }]}>
                  {item.type === 'attendance' ? 'Work Session' : 'Payment Received'}
                </Text>
              </View>
              <View style={styles.actRight}>
                <Text style={styles.actAmount}>
                  {item.type === 'attendance' ? (item.siteId?.name || "On-Site") : `₹${item.paidAmount}`}
                </Text>
                <View style={styles.actBadge}>
                  <Text style={styles.actBadgeText}>
                    {item.type === 'attendance' ? `${item.hoursWorked} Hours` : item.remark || 'Direct Transfer'}
                  </Text>
                </View>
              </View>
            </View>
          )) : (
            <Text style={styles.emptyText}>No recent activity found.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 24, paddingBottom: 8, gap: 12 },
  title: { color: COLORS.foreground, fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: COLORS.mutedForeground, fontSize: 14, marginTop: 2 },
  ownerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  ownerText: { color: COLORS.mutedForeground, fontSize: 13 },
  ownerName: { color: COLORS.primary, fontWeight: "700" },
  heroCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xxl,
    padding: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOW.primary,
  },
  heroLeft: {},
  heroLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", marginBottom: 4 },
  heroValue: { color: "#fff", fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  heroSub: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 4 },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.xl,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  miniStats: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 12 },
  miniCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  miniIcon: { marginBottom: 8 },
  miniLabel: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  miniValue: { fontSize: 22, fontWeight: "900" },
  section: {
    margin: 16,
    marginTop: 8,
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
    marginBottom: 16,
  },
  sectionTitle: { color: COLORS.foreground, fontSize: 17, fontWeight: "900" },
  viewAll: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  actRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    overflow: "hidden",
  },
  actBar: { width: 4, height: "100%", minHeight: 56 },
  actInfo: { flex: 1, paddingVertical: 12, paddingLeft: 14 },
  actDate: { color: COLORS.foreground, fontSize: 14, fontWeight: "700" },
  actStatus: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  actRight: { paddingRight: 14, alignItems: "flex-end" },
  actAmount: { color: COLORS.foreground, fontSize: 14, fontWeight: "800" },
  actBadge: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  actBadgeText: { color: COLORS.mutedForeground, fontSize: 9, fontWeight: "600" },
});
