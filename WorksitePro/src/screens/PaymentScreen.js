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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import API from "../services/api";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

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
      Alert.alert("Error", typeof e === "string" ? e : "Payment failed");
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
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Aggregating Ledgers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Financial Accounts</Text>
        <Text style={styles.subtitle}>Live ledger for workforce settlements.</Text>
      </View>

      <FlatList
        data={filteredWorkers}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <>
            {/* Stats Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
                <Text style={styles.statLabel}>Outstanding</Text>
                <Text style={[styles.statValue, { color: COLORS.primary }]}>
                  ₹{totalOutstanding.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.green }]}>
                <Text style={styles.statLabel}>Lifetime Paid</Text>
                <Text style={[styles.statValue, { color: COLORS.green }]}>
                  ₹{totalDisbursed.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: COLORS.orange }]}>
                <Text style={styles.statLabel}>With Dues</Text>
                <Text style={[styles.statValue, { color: COLORS.orange }]}>
                  {workersWithDues}
                </Text>
              </View>
            </View>

            {/* Search + Site Filter */}
            <View style={styles.searchSection}>
              <View style={styles.searchInput}>
                <Ionicons name="search" size={18} color={COLORS.mutedForeground} />
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
                style={{ marginTop: 10 }}
                contentContainerStyle={{ gap: 8, paddingHorizontal: 0 }}
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
          <View style={styles.workerCard}>
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
            <TouchableOpacity
              style={[
                styles.payBtn,
                worker.dueAmount <= 0 && styles.payBtnDisabled,
              ]}
              disabled={worker.dueAmount <= 0}
              onPress={() => {
                setSelectedWorker(worker);
                setPayAmount(String(worker.dueAmount || ""));
                setIsPayOpen(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="wallet-outline" size={16} color="#fff" />
              <Text style={styles.payBtnText}>
                {worker.dueAmount > 0 ? "Pay Now" : "Settled"}
              </Text>
            </TouchableOpacity>
          </View>
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
                <Ionicons name="close-circle" size={28} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalTitle}>Record Disbursement</Text>
            <Text style={styles.modalSub}>
              Settling dues for{" "}
              <Text style={{ color: COLORS.foreground, fontWeight: "700" }}>
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

            <View style={styles.amountInput}>
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

            <TouchableOpacity
              style={[styles.finalizeBtn, processing && { opacity: 0.6 }]}
              onPress={handleRecordPayment}
              disabled={processing}
              activeOpacity={0.85}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.finalizeBtnText}>Finalize Settlement</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    color: COLORS.mutedForeground,
    marginTop: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontSize: 11,
  },
  header: { padding: 24, paddingBottom: 8 },
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
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  statLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  searchSection: { paddingHorizontal: 24, marginBottom: 8 },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 46,
  },
  searchText: { flex: 1, color: COLORS.foreground, fontSize: 14 },
  sitePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  sitePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  sitePillText: { color: COLORS.mutedForeground, fontWeight: "700", fontSize: 12 },
  sitePillTextActive: { color: "#fff" },
  listHeader: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 24,
    marginBottom: 10,
    marginTop: 8,
  },
  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 10 },
  emptyTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "700" },
  workerCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  workerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.primary + "40",
  },
  avatarText: { color: COLORS.primary, fontWeight: "900", fontSize: 20 },
  workerInfo: { flex: 1 },
  workerName: { color: COLORS.foreground, fontSize: 15, fontWeight: "800" },
  workerPhone: { color: COLORS.mutedForeground, fontSize: 11, marginTop: 2 },
  workerType: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  amountCol: { alignItems: "flex-end" },
  dueAmt: { fontSize: 16, fontWeight: "900" },
  paidAmt: { color: COLORS.mutedForeground, fontSize: 11, marginTop: 2 },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 11,
    ...SHADOW.primary,
  },
  payBtnDisabled: { backgroundColor: COLORS.muted, ...{ shadowOpacity: 0 } },
  payBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  modalIconBox: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: "center",
  },
  modalInfoLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  modalInfoVal: { color: COLORS.foreground, fontSize: 18, fontWeight: "900" },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 18,
    ...SHADOW.primary,
    marginBottom: 8,
  },
  finalizeBtnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
