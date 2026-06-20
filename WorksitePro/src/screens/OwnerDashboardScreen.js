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
  Modal,
  TextInput,
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

  // History states
  const [historyTab, setHistoryTab] = useState("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [workers, setWorkers] = useState([]);
  const [workersLoading, setWorkersLoading] = useState(false);
  
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [modalViewType, setModalViewType] = useState("list");
  const [fetchingWorkerHistory, setFetchingWorkerHistory] = useState(false);
  const [workerLogs, setWorkerLogs] = useState([]);
  const [workerPayments, setWorkerPayments] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Admin Wise states
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [fetchingAdminHistory, setFetchingAdminHistory] = useState(false);
  const [adminPayments, setAdminPayments] = useState([]);
  const [giveMoneyAmount, setGiveMoneyAmount] = useState("");
  const [giveMoneyRemark, setGiveMoneyRemark] = useState("");
  const [recordingAdminPayment, setRecordingAdminPayment] = useState(false);

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

  const fetchWorkers = async () => {
    try {
      setWorkersLoading(true);
      const res = await API.get("/owners/workers");
      if (res.data.success) {
        setWorkers(res.data.data);
      }
    } catch (e) {
      console.log("Failed to fetch workers", e);
    } finally {
      setWorkersLoading(false);
    }
  };

  const openWorkerHistory = async (worker) => {
    setSelectedWorker(worker);
    setShowHistoryModal(true);
    setFetchingWorkerHistory(true);
    setWorkerLogs([]);
    setWorkerPayments([]);
    try {
      const res = await API.get(`/attendance/history/${worker._id}`);
      if (res.data.success) {
        setWorkerLogs(res.data.data.attendance || []);
        setWorkerPayments(res.data.data.payments || []);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to fetch worker history.");
    } finally {
      setFetchingWorkerHistory(false);
    }
  };

  const openAdminHistory = async (admin) => {
    setSelectedAdmin(admin);
    setShowAdminModal(true);
    setFetchingAdminHistory(true);
    setAdminPayments([]);
    setGiveMoneyAmount("");
    setGiveMoneyRemark("");
    try {
      const res = await API.get(`/attendance/history/${admin._id}`);
      if (res.data.success) {
        setAdminPayments(res.data.data.payments || []);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to fetch admin payment history.");
    } finally {
      setFetchingAdminHistory(false);
    }
  };

  const handleGiveMoneyToAdmin = async () => {
    if (!selectedAdmin) return;
    const amountNum = parseFloat(giveMoneyAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive payment amount.");
      return;
    }

    try {
      setRecordingAdminPayment(true);
      const res = await API.post("/payments/direct-pay", {
        workerId: selectedAdmin._id,
        amount: amountNum,
        remark: giveMoneyRemark.trim() || "Given to Admin"
      });

      if (res.data.success) {
        Alert.alert("Success", `Successfully recorded payment of ₹${amountNum} to ${selectedAdmin.name}.`);
        setGiveMoneyAmount("");
        setGiveMoneyRemark("");
        
        // Refresh history list immediately
        const histRes = await API.get(`/attendance/history/${selectedAdmin._id}`);
        if (histRes.data.success) {
          setAdminPayments(histRes.data.data.payments || []);
        }
        
        // Also refresh general dashboard data to update totalPaid
        fetchData();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to record payment.";
      Alert.alert("Error", errMsg);
    } finally {
      setRecordingAdminPayment(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    fetchWorkers();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "GOOD MORNING";
    if (h < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  };

  const filteredWorkers = workers.filter(w => 
    (w.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (w.phone || "").includes(searchQuery)
  );

  const renderHistoryModal = () => {
    if (!selectedWorker) return null;

    const activities = [
      ...workerLogs.map(l => ({
        _id: l._id,
        type: 'attendance',
        user: l.workerId?.name || selectedWorker.name,
        label: l.overtimeHours > 0 ? `Marked Present (+${l.overtimeHours}h OT)` : "Marked Present",
        time: l.date || l.createdAt
      })),
      ...workerPayments.map(p => ({
        _id: p._id,
        type: 'payment',
        user: p.workerId?.name || selectedWorker.name,
        label: `Received ₹${(p.paidAmount || 0).toLocaleString()}${p.remark ? ` (${p.remark})` : ""}`,
        time: p.createdAt
      }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    const formatDateTime = (timeStr) => {
      const date = new Date(timeStr);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      const tStr = `${formattedHours}:${formattedMinutes} ${ampm}`;
      
      const dStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      return `${tStr} • ${dStr}`;
    };

    return (
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalUserRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>{(selectedWorker.name?.[0] || "").toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.modalWorkerName}>{selectedWorker.name}</Text>
                  <Text style={styles.modalWorkerSub}>{selectedWorker.workerType || "Admin"} • {selectedWorker.phone}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {fetchingWorkerHistory ? (
              <View style={styles.modalLoader}>
                <Loader message="Fetching history archives..." />
              </View>
            ) : (
              <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 10 }}>
                {activities.length > 0 ? (
                  activities.map((activity, idx) => (
                    <GlassCard level={2} key={idx} style={styles.activityCard}>
                      <View style={styles.activityRow}>
                        <View style={[styles.activityIconBox, activity.type === "payment" && { backgroundColor: COLORS.purpleLight }]}>
                          <Ionicons 
                            name={activity.type === "attendance" ? "checkmark-circle" : "cash"} 
                            size={18} 
                            color={activity.type === "attendance" ? COLORS.green : COLORS.purple} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityUser}>{activity.user}</Text>
                          <Text style={styles.activityLabel}>{activity.label}</Text>
                        </View>
                        <Text style={styles.activityTime}>
                          {formatDateTime(activity.time)}
                        </Text>
                      </View>
                    </GlassCard>
                  ))
                ) : (
                  <Text style={styles.noHistoryText}>No records found in the last 30 days.</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  const renderAdminModal = () => {
    if (!selectedAdmin) return null;

    const formatDateTime = (timeStr) => {
      const date = new Date(timeStr);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
      const tStr = `${formattedHours}:${formattedMinutes} ${ampm}`;
      
      const dStr = date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      return `${tStr} • ${dStr}`;
    };

    return (
      <Modal
        visible={showAdminModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalUserRow}>
                <View style={[styles.modalAvatar, { backgroundColor: COLORS.purple }]}>
                  <Text style={styles.modalAvatarText}>{(selectedAdmin.name?.[0] || "").toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.modalWorkerName}>{selectedAdmin.name}</Text>
                  <Text style={styles.modalWorkerSub}>Admin • {selectedAdmin.phone}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAdminModal(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Scrollable container for give money form and history */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 16 }}>
              {/* Give Money Form (Card) */}
              <GlassCard level={2} style={styles.giveMoneyCard}>
                <Text style={styles.giveMoneyTitle}>Disburse Money to Admin</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Amount (₹)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Enter amount given..."
                    placeholderTextColor={COLORS.mutedForeground}
                    keyboardType="numeric"
                    value={giveMoneyAmount}
                    onChangeText={setGiveMoneyAmount}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Remark / Notes</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. For weekly site expenses..."
                    placeholderTextColor={COLORS.mutedForeground}
                    value={giveMoneyRemark}
                    onChangeText={setGiveMoneyRemark}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.submitPaymentBtn, recordingAdminPayment && { opacity: 0.7 }]}
                  onPress={handleGiveMoneyToAdmin}
                  disabled={recordingAdminPayment}
                >
                  <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.submitPaymentBtnText}>
                    {recordingAdminPayment ? "Processing..." : "Disburse Cash"}
                  </Text>
                </TouchableOpacity>
              </GlassCard>

              {/* Payments History List */}
              <Text style={styles.subSectionTitle}>Payments Given History</Text>
              
              {fetchingAdminHistory ? (
                <View style={styles.modalLoader}>
                  <Loader message="Fetching disbursement logs..." />
                </View>
              ) : adminPayments.length > 0 ? (
                adminPayments.map((payment, idx) => (
                  <GlassCard level={2} key={idx} style={styles.activityCard}>
                    <View style={styles.activityRow}>
                      <View style={[styles.activityIconBox, { backgroundColor: COLORS.purpleLight }]}>
                        <Ionicons 
                          name="cash" 
                          size={18} 
                          color={COLORS.purple} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityUser}>{selectedAdmin.name}</Text>
                        <Text style={styles.activityLabel}>
                          Received ₹{payment.paidAmount.toLocaleString()}{payment.remark ? ` (${payment.remark})` : ""}
                        </Text>
                      </View>
                      <Text style={styles.activityTime}>
                        {formatDateTime(payment.createdAt)}
                      </Text>
                    </View>
                  </GlassCard>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No payments given to this admin yet.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
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

        {/* Invite Code Badges */}
        <View style={styles.inviteRow}>
          <TouchableOpacity 
            style={styles.miniInviteBadge} 
            onPress={() => {
              const code = data.owner?.workerInviteCode || data.owner?.inviteCode;
              if (code) {
                Clipboard.setString(code);
                Alert.alert("Copied!", "Worker Invite code copied to clipboard.");
              }
            }} 
            activeOpacity={0.8}
          >
             <Ionicons name="construct-outline" size={13} color={COLORS.primary} />
             <Text style={styles.miniInviteText}>Worker: {data.owner?.workerInviteCode || data.owner?.inviteCode || "—"}</Text>
             <Ionicons name="copy-outline" size={12} color={COLORS.primary} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          {user?.role === "Owner" && (
            <TouchableOpacity 
              style={styles.miniInviteBadge} 
              onPress={() => {
                const code = data.owner?.adminInviteCode || data.owner?.inviteCode;
                if (code) {
                  Clipboard.setString(code);
                  Alert.alert("Copied!", "Admin Invite code copied to clipboard.");
                }
              }} 
              activeOpacity={0.8}
            >
               <Ionicons name="shield-outline" size={13} color={COLORS.primary} />
               <Text style={styles.miniInviteText}>Admin: {data.owner?.adminInviteCode || data.owner?.inviteCode || "—"}</Text>
               <Ionicons name="copy-outline" size={12} color={COLORS.primary} style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          )}
        </View>

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
        </View>

        {/* History Section */}
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Organization History</Text>
          
          {/* Switcher tabs */}
          <View style={styles.historyTabsRow}>
            <TouchableOpacity 
              style={[styles.historyTabBtn, historyTab === "recent" && styles.historyTabBtnActive]} 
              onPress={() => setHistoryTab("recent")}
            >
              <Text style={[styles.historyTabBtnText, historyTab === "recent" && styles.historyTabBtnTextActive]}>
                Recent
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.historyTabBtn, historyTab === "worker" && styles.historyTabBtnActive]} 
              onPress={() => setHistoryTab("worker")}
            >
              <Text style={[styles.historyTabBtnText, historyTab === "worker" && styles.historyTabBtnTextActive]}>
                Workers
              </Text>
            </TouchableOpacity>
            {user?.role === "Owner" && (
              <TouchableOpacity 
                style={[styles.historyTabBtn, historyTab === "admin" && styles.historyTabBtnActive]} 
                onPress={() => setHistoryTab("admin")}
              >
                <Text style={[styles.historyTabBtnText, historyTab === "admin" && styles.historyTabBtnTextActive]}>
                  Admins
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {historyTab === "recent" ? (
            <View style={styles.recentList}>
              {data.recentActivity && data.recentActivity.length > 0 ? (
                data.recentActivity.map((activity, idx) => (
                  <GlassCard level={2} key={idx} style={styles.activityCard}>
                    <View style={styles.activityRow}>
                      <View style={[styles.activityIconBox, activity.type === "payment" && { backgroundColor: COLORS.purpleLight }]}>
                        <Ionicons 
                          name={activity.type === "attendance" ? "checkmark-circle" : "cash"} 
                          size={18} 
                          color={activity.type === "attendance" ? COLORS.green : COLORS.purple} 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityUser}>{activity.user}</Text>
                        <Text style={styles.activityLabel}>{activity.label}</Text>
                      </View>
                      <Text style={styles.activityTime}>
                        {new Date(activity.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </GlassCard>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No recent activity logged.</Text>
              )}
            </View>
          ) : (
            <View style={styles.workerListContainer}>
              <View style={styles.searchBar}>
                <Ionicons name="search" size={18} color={COLORS.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={historyTab === "worker" ? "Search workers by name or phone..." : "Search admins by name or phone..."}
                  placeholderTextColor={COLORS.mutedForeground}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery !== "" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close" size={18} color={COLORS.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              {workersLoading ? (
                <Loader message="Loading directory..." />
              ) : (() => {
                const targetRole = historyTab === "worker" ? "Worker" : "Admin";
                if (targetRole === "Admin" && user?.role !== "Owner") return null;
                const matchingUsers = filteredWorkers.filter(w => w.role === targetRole);
                
                if (matchingUsers.length > 0) {
                  return matchingUsers.map((user) => (
                    <TouchableOpacity 
                      key={user._id} 
                      style={styles.workerRowBtn} 
                      onPress={() => historyTab === "worker" ? openWorkerHistory(user) : openAdminHistory(user)}
                      activeOpacity={0.7}
                    >
                      <GlassCard level={2} style={styles.workerGlassCard}>
                        <View style={styles.workerRowContent}>
                          <View style={[styles.workerAvatarMini, historyTab === "admin" && { backgroundColor: COLORS.purple }]}>
                            <Text style={styles.workerAvatarTextMini}>{(user.name?.[0] || "").toUpperCase()}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.workerRowName}>{user.name}</Text>
                            <Text style={styles.workerRowSub}>{user.workerType || user.role} • {user.phone}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={18} color={COLORS.mutedForeground} />
                        </View>
                      </GlassCard>
                    </TouchableOpacity>
                  ));
                } else {
                  return (
                    <Text style={styles.noHistoryText}>
                      {historyTab === "worker" ? "No matching workers found." : "No matching admins found."}
                    </Text>
                  );
                }
              })()}
            </View>
          )}
        </View>
      </ScrollView>
      {renderHistoryModal()}
      {renderAdminModal()}
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
  inviteRow: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  miniInviteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 111, 247, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(124, 111, 247, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
    flex: 1,
    justifyContent: "center",
  },
  miniInviteText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.1,
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
  historySection: {
    paddingHorizontal: 24,
    marginTop: 12,
    gap: 12,
  },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  historyTabsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderRadius: RADIUS.lg,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  historyTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.md,
  },
  historyTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  historyTabBtnText: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  historyTabBtnTextActive: {
    color: "#fff",
    fontWeight: "900",
  },
  recentList: {
    gap: 10,
  },
  activityCard: {
    padding: 12,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityIconBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.greenLight,
    alignItems: "center",
    justifyContent: "center",
  },
  activityUser: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  activityLabel: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  activityTime: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "750",
  },
  noHistoryText: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 20,
    fontWeight: "600",
  },
  workerListContainer: {
    gap: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 13,
    height: "100%",
  },
  workerRowBtn: {
    width: "100%",
  },
  workerGlassCard: {
    padding: 12,
  },
  workerRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  workerAvatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  workerAvatarTextMini: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  workerRowName: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "800",
  },
  workerRowSub: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 15, 0.85)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "rgba(25, 25, 35, 0.98)",
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    height: "80%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "900",
  },
  modalWorkerName: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  modalWorkerSub: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
  },
  modalLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalViewSwitcher: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  modalSwitchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalSwitchBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalSwitchText: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
  },
  modalSwitchTextActive: {
    color: "#fff",
  },
  modalCalendarScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  customCalendarContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: RADIUS.xl,
    padding: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarHeaderText: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dayLabel: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "900",
    width: 32,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  calendarDaySlot: {
    width: "14%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dayText: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
  },
  dotContainer: {
    position: "absolute",
    bottom: 2,
    flexDirection: "row",
    gap: 2,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendText: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "800",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: RADIUS.lg,
  },
  logRowPayment: {
    borderColor: "rgba(34, 197, 94, 0.15)",
  },
  logIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logDate: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: "800",
  },
  logSite: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  logPresent: {
    color: COLORS.green,
    fontSize: 13,
    fontWeight: "800",
  },
  logOvertime: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  giveMoneyCard: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: RADIUS.lg,
  },
  giveMoneyTitle: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    color: COLORS.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  formInput: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.md,
    color: COLORS.foreground,
    fontSize: 13,
    paddingHorizontal: 12,
    height: 40,
  },
  submitPaymentBtn: {
    backgroundColor: COLORS.primary,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
  },
  submitPaymentBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  subSectionTitle: {
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 12,
    marginBottom: 4,
  },
});
