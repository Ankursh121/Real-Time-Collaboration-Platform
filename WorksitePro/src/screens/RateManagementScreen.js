import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import API from "../services/api";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";
import FuturisticButton from "../components/FuturisticButton";
import StatusBadge from "../components/StatusBadge";

const WORKER_TYPES = ["Labour", "Mistri", "Satring-Labour", "Satring-Mistri"];

export default function RateManagementScreen() {
  const [sites, setSites] = useState([]);
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    siteId: "global",
    workerType: "Labour",
    dailyRate: "",
    overtimeRatePerHour: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [siteRes, rateRes] = await Promise.all([
        API.get("/sites"),
        API.get("/rates"),
      ]);
      if (siteRes.data.success) setSites(siteRes.data.data);
      if (rateRes.data.success) setRates(rateRes.data.data);
    } catch { 
      Alert.alert("Error", "Failed to sync rates."); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSetRate = async () => {
    if (!formData.dailyRate || !formData.overtimeRatePerHour)
      return Alert.alert("Missing Fields", "Please fill in all rate values.");

    setSaving(true);
    try {
      const payload = {
        ...formData,
        siteId: formData.siteId === "global" ? null : formData.siteId,
        dailyRate: parseFloat(formData.dailyRate),
        overtimeRatePerHour: parseFloat(formData.overtimeRatePerHour),
      };
      const res = await API.post("/rates/set", payload);
      if (res.data.success) {
        Alert.alert("Success", "Compensation parameters updated.");
        fetchData();
        setFormData({ siteId: "global", workerType: "Labour", dailyRate: "", overtimeRatePerHour: "" });
      }
    } catch (e) { 
      Alert.alert("Error", typeof e === "string" ? e : (e.message || "Action failed")); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDeleteRate = async (rateId) => {
    try {
      const res = await API.delete(`/rates/${rateId}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", "Failed to delete rate configuration.");
    }
  };

  const activeRates = rates.filter((r) => r.isActive);
  const archiveRates = rates.filter((r) => !r.isActive).slice(0, 10);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wage Configuration</Text>
          <Text style={styles.subtitle}>Define role-based daily remuneration.</Text>
        </View>

        {/* Form Card */}
        <GlassCard level={2} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconBox}>
              <Ionicons name="add-circle" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.cardTitle}>New Directive</Text>
          </View>

          {/* Site Picker */}
          <Text style={styles.fieldLabel}>Operational Site</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={{ marginBottom: 18 }}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {[{ _id: "global", name: "Global Default" }, ...sites].map((s) => (
              <TouchableOpacity
                key={s._id}
                style={[styles.pill, formData.siteId === s._id && styles.pillActive]}
                onPress={() => setFormData({ ...formData, siteId: s._id })}
                activeOpacity={0.8}
              >
                <Text style={[styles.pillText, formData.siteId === s._id && styles.pillTextActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Category Picker */}
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.typeGrid}>
            {WORKER_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, formData.workerType === t && styles.typeBtnActive]}
                onPress={() => setFormData({ ...formData, workerType: t })}
                activeOpacity={0.8}
              >
                <Text style={[styles.typeBtnText, formData.workerType === t && styles.typeBtnTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Daily Rate */}
          <Text style={styles.fieldLabel}>Daily Rate (₹)</Text>
          <View style={styles.inputRow}>
            <Text style={styles.rupee}>₹</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={COLORS.mutedForeground}
              value={formData.dailyRate}
              onChangeText={(v) => setFormData({ ...formData, dailyRate: v })}
            />
          </View>

          {/* Overtime Rate */}
          <Text style={styles.fieldLabel}>Overtime Rate (₹/hr)</Text>
          <View style={styles.inputRow}>
            <Ionicons name="time-outline" size={20} color={COLORS.mutedForeground} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={COLORS.mutedForeground}
              value={formData.overtimeRatePerHour}
              onChangeText={(v) => setFormData({ ...formData, overtimeRatePerHour: v })}
            />
          </View>

          <FuturisticButton
            variant="primary"
            onPress={handleSetRate}
            loading={saving}
            icon={<Ionicons name="save-outline" size={20} color="#fff" />}
            style={styles.submitBtn}
          >
            Enforce Rates
          </FuturisticButton>
        </GlassCard>

        {/* Active Rates */}
        <GlassCard level={2} style={styles.card}>
          <Text style={[styles.cardTitle, { color: COLORS.primary, marginBottom: 16 }]}>
            ✓ Active Remuneration Matrix
          </Text>
          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
          ) : activeRates.length === 0 ? (
            <Text style={styles.emptyText}>No active configurations</Text>
          ) : (
            activeRates.map((r) => (
              <View key={r._id} style={styles.rateRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.rateSite}>{r.siteId?.name || "Global / Default"}</Text>
                  <View style={styles.rateTypeRow}>
                    <MaterialCommunityIcons
                      name={r.workerType.includes("Mistri") ? "shield-check" : "hard-hat"}
                      size={14}
                      color={r.workerType.includes("Mistri") ? COLORS.orange : COLORS.blue}
                    />
                    <Text style={styles.rateType}>{r.workerType}</Text>
                  </View>
                </View>
                <View style={{ alignItems: "center", flexDirection: "row", gap: 16 }}>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.rateDaily}>₹{r.dailyRate}/day</Text>
                    <Text style={styles.rateOT}>₹{r.overtimeRatePerHour}/hr OT</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteRate(r._id)} activeOpacity={0.8}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        {/* Archive */}
        {archiveRates.length > 0 && (
          <GlassCard level={2} style={[styles.card, { opacity: 0.65 }]}>
            <Text style={[styles.cardTitle, { color: COLORS.mutedForeground, marginBottom: 16 }]}>
              Rate Archive
            </Text>
            {archiveRates.map((r) => (
              <View key={r._id} style={styles.archiveRow}>
                <Text style={styles.archiveText} numberOfLines={1}>{r.siteId?.name || "Global"}</Text>
                <Text style={styles.archiveText}>{r.workerType}</Text>
                <Text style={styles.archiveText}>₹{r.dailyRate}</Text>
                <TouchableOpacity onPress={() => handleDeleteRate(r._id)} activeOpacity={0.8}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </GlassCard>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { 
    padding: 24, 
    paddingBottom: 8,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
  },
  title: { color: COLORS.foreground, fontSize: 26, fontWeight: "900", letterSpacing: -0.8 },
  subtitle: { color: COLORS.mutedForeground, fontSize: 14, marginTop: 4 },
  card: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 0,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(124, 111, 247, 0.3)",
    borderWidth: 1,
  },
  cardTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  fieldLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(26,26,36,0.5)",
  },
  pillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  pillText: { color: COLORS.mutedForeground, fontWeight: "800", fontSize: 12 },
  pillTextActive: { color: "#fff" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  typeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(26,26,36,0.5)",
  },
  typeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
  },
  typeBtnText: { color: COLORS.mutedForeground, fontWeight: "800", fontSize: 13 },
  typeBtnTextActive: { color: COLORS.primary },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 18,
  },
  rupee: { color: COLORS.primary, fontSize: 20, fontWeight: "900", marginRight: 8 },
  input: { flex: 1, color: COLORS.foreground, fontSize: 18, fontWeight: "800" },
  submitBtn: {
    marginTop: 8,
    width: "100%",
  },
  rateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  rateSite: { color: COLORS.foreground, fontWeight: "800", fontSize: 14 },
  rateTypeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  rateType: { color: COLORS.mutedForeground, fontSize: 12, fontWeight: "700" },
  rateDaily: { color: COLORS.primary, fontWeight: "900", fontSize: 16 },
  rateOT: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2, fontWeight: "600" },
  emptyText: { color: COLORS.mutedForeground, textAlign: "center", paddingVertical: 20, fontWeight: "600" },
  archiveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  archiveText: { color: COLORS.mutedForeground, fontSize: 12, fontWeight: "600", flex: 1, marginRight: 8 },
});
