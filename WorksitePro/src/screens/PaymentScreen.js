import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API from "../services/api";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";
import FuturisticButton from "../components/FuturisticButton";
import StatusBadge from "../components/StatusBadge";
import GlowingInput from "../components/GlowingInput";

export default function PaymentScreen() {
  const [workerSummaries, setWorkerSummaries] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("all");

  // Pay modal
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryRes, siteRes] = await Promise.all([
        API.get("/payments/summary"),
        API.get("/sites"),
      ]);
      if (summaryRes.data.success) setWorkerSummaries(summaryRes.data.data);
      if (siteRes.data.success) setSites(siteRes.data.data);
    } catch {
      Alert.alert("Error", "Failed to load financial data.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleRecordPayment = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0)
      return Alert.alert("Invalid", "Please enter a valid amount.");
    setProcessing(true);
    try {
      const res = await API.post("/payments/direct-pay", {
        workerId: selectedWorker._id,
        amount,
      });
      if (res.data.success) {
        Alert.alert("Success", `₹${amount} recorded for ${selectedWorker.name}`);
        setIsPayOpen(false);
        setPayAmount("");
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", typeof e === "string" ? e : (e.message || "Payment failed"));
    } finally {
      setProcessing(false);
    }
  };

  const filteredWorkers = workerSummaries.filter((w) => {
    const matchSearch =
      (w.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (w.phone || "").includes(searchTerm);
    const matchSite = selectedSiteId === "all" || w.siteId === selectedSiteId;
    return matchSearch && matchSite;
  });

  const totalOutstanding = workerSummaries.reduce((a, w) => a + (w.dueAmount || 0), 0);
  const totalDisbursed = workerSummaries.reduce((a, w) => a + (w.totalPaid || 0), 0);
  const workersWithDues = workerSummaries.filter((w) => w.dueAmount > 0).length;

  if (loading) {
    return (
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Aggregating Ledgers..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Financial Accounts</Text>
        <Text style={styles.subtitle}>Live ledger for workforce settlements.</Text>
      </View>

      <FlatList
        data={filteredWorkers}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
        ListHeaderComponent={
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <GlassCard level={2} style={[styles.statCard, { borderLeftColor: COLORS.primary, borderLeftWidth: 3 }]}>
                <Text style={styles.statLabel}>Outstanding</Text>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>
                  ₹{totalOutstanding.toLocaleString()}
                </Text>
              </GlassCard>
              <GlassCard level={2} style={[styles.statCard, { borderLeftColor: COLORS.green, borderLeftWidth: 3 }]}>
                <Text style={styles.statLabel}>Lifetime Paid</Text>
                <Text style={[styles.statValue, { color: COLORS.green }]}>
                  ₹{totalDisbursed.toLocaleString()}
                </Text>
              </GlassCard>
              <GlassCard level={2} style={[styles.statCard, { borderLeftColor: COLORS.orange, borderLeftWidth: 3 }]}>
                <Text style={styles.statLabel}>With Dues</Text>
                <Text style={[styles.statValue, { color: COLORS.orange }]}>
                  {workersWithDues}
                </Text>
              </GlassCard>
            </View>

            {/* Search + Site Filter */}
            <View style={styles.searchSection}>
              <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={18} color={COLORS.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchText}
                  placeholder="Search by name or phone..."
                  placeholderTextColor={COLORS.mutedForeground}
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 12 }}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {[{ _id: "all", name: "All Sites" }, ...sites].map((s) => (
                  <TouchableOpacity
                    key={s._id}
                    style={[
                      styles.sitePill,
                      selectedSiteId === s._id && styles.sitePillActive,
                    ]}
                    onPress={() => setSelectedSiteId(s._id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.sitePillText,
                        selectedSiteId === s._id && styles.sitePillTextActive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.listHeader}>
              {filteredWorkers.length} Workers
            </Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={COLORS.mutedForeground} />
            <Text style={styles.emptyTitle}>No Workers Found</Text>
          </View>
        }
        renderItem={({ item: worker }) => (
          <GlassCard level={2} style={styles.workerCard}>
            <View style={styles.workerRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(worker.name?.[0] || "?").toUpperCase()}
                </Text>
              </View>
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerPhone}>{worker.phone}</Text>
                <Text style={styles.workerType}>
                  {worker.workerType || "Labour"}
                </Text>
              </View>
              <View style={styles.amountCol}>
                <Text
                  style={[
                    styles.dueAmt,
                    { color: worker.dueAmount > 0 ? COLORS.red : COLORS.green },
                  ]}
                >
                  ₹{(worker.dueAmount || 0).toLocaleString()}
                </Text>
                <Text style={styles.paidAmt}>
                  Paid: ₹{(worker.totalPaid || 0).toLocaleString()}
                </Text>
              </View>
            </View>
            <FuturisticButton
              variant={worker.dueAmount > 0 ? "primary" : "glass"}
              disabled={worker.dueAmount <= 0}
              onPress={() => {
                setSelectedWorker(worker);
                setPayAmount(String(worker.dueAmount || ""));
                setIsPayOpen(true);
              }}
              icon={<Ionicons name="wallet-outline" size={16} color={worker.dueAmount > 0 ? "#fff" : COLORS.primary} />}
              style={styles.payBtn}
            >
              {worker.dueAmount > 0 ? "Pay Now" : "Settled"}
            </FuturisticButton>
          </GlassCard>
        )}
      />

      {/* Pay Modal */}
      <Modal visible={isPayOpen} transparent animationType="slide" onRequestClose={() => setIsPayOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTop}>
              <View style={styles.modalIconBox}>
                <Ionicons name="wallet" size={28} color={COLORS.primary} />
              </View>
              <TouchableOpacity onPress={() => setIsPayOpen(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>Record Disbursement</Text>
            <Text style={styles.modalSub}>
              Settling dues for{" "}
              <Text style={{ color: COLORS.foreground, fontWeight: "800" }}>
                {selectedWorker?.name}
              </Text>
            </Text>

            <View style={styles.modalInfoRow}>
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>Total Earned</Text>
                <Text style={styles.modalInfoVal}>
                  ₹{(selectedWorker?.totalEarned || 0).toLocaleString()}
                </Text>
              </View>
              <View style={styles.modalInfo}>
                <Text style={styles.modalInfoLabel}>Already Paid</Text>
                <Text style={[styles.modalInfoVal, { color: COLORS.green }]}>
                  ₹{(selectedWorker?.totalPaid || 0).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.rupeeSym}>₹</Text>
              <TextInput
                style={styles.amountField}
                keyboardType="numeric"
                value={payAmount}
                onChangeText={setPayAmount}
                placeholder="0.00"
                placeholderTextColor={COLORS.mutedForeground}
                autoFocus
              />
            </View>

            <FuturisticButton
              variant="primary"
              onPress={handleRecordPayment}
              loading={processing}
              icon={<Ionicons name="save-outline" size={20} color="#fff" />}
              style={styles.finalizeBtn}
            >
              Finalize Settlement
            </FuturisticButton>
          </View>
        </View>
      </Modal>
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
  },
  title: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: { color: COLORS.mutedForeground, fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 20,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    padding: 0,
  },
  statLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "900",
  },
  searchSection: { paddingHorizontal: 24, marginBottom: 8 },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    paddingHorizontal: 14,
    height: 48,
  },
  searchText: { flex: 1, color: COLORS.foreground, fontSize: 14, fontWeight: "600" },
  sitePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(26, 26, 36, 0.5)",
  },
  sitePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  sitePillText: { color: COLORS.mutedForeground, fontWeight: "800", fontSize: 12 },
  sitePillTextActive: { color: "#fff" },
  listHeader: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 10,
    marginTop: 12,
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "800" },
  workerCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 0,
  },
  workerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 111, 247, 0.3)",
  },
  avatarText: { color: COLORS.primary, fontWeight: "900", fontSize: 20 },
  workerInfo: { flex: 1 },
  workerName: { color: COLORS.foreground, fontSize: 15, fontWeight: "800" },
  workerPhone: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2 },
  workerType: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  amountCol: { alignItems: "flex-end" },
  dueAmt: { fontSize: 16, fontWeight: "900" },
  paidAmt: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2, fontWeight: "500" },
  payBtn: {
    width: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#0f0f14",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1.5,
    borderColor: "rgba(124, 111, 247, 0.3)",
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, alignItems: "center" },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(124, 111, 247, 0.3)",
    borderWidth: 1,
  },
  modalTitle: {
    color: COLORS.foreground,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4,
  },
  modalSub: { color: COLORS.mutedForeground, fontSize: 14, marginBottom: 20 },
  modalInfoRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  modalInfo: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: "center",
  },
  modalInfoLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalInfoVal: { color: COLORS.foreground, fontSize: 18, fontWeight: "900" },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 16,
    height: 72,
    marginBottom: 20,
  },
  rupeeSym: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
    marginRight: 8,
  },
  amountField: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 28,
    fontWeight: "900",
  },
  finalizeBtn: {
    width: "100%",
  },
});
