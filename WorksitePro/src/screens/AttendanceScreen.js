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
  Modal,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";
import FuturisticButton from "../components/FuturisticButton";
import GlowingInput from "../components/GlowingInput";
import StatusBadge from "../components/StatusBadge";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [sites, setSites] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [siteStats, setSiteStats] = useState(null);

  // History modal
  const [historyModal, setHistoryModal] = useState(false);
  const [historyWorker, setHistoryWorker] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [viewType, setViewType] = useState("calendar"); // 'calendar' or 'list'
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchData = async () => {
    try {
      setLoading(true);
      const [siteRes, workerRes] = await Promise.all([
        API.get("/sites"),
        API.get("/owners/workers"),
      ]);
      if (siteRes.data.success && siteRes.data.data.length > 0) {
        setSites(siteRes.data.data);
        setSelectedSiteId(siteRes.data.data[0]._id);
      }
      if (workerRes.data.success) setWorkers(workerRes.data.data);
    } catch {
      Alert.alert("Error", "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteStats = async (siteId) => {
    if (!siteId) return;
    try {
      const res = await API.get(`/sites/stats/${siteId}`);
      if (res.data.success) setSiteStats(res.data.data);
    } catch {}
  };

  const openHistory = async (worker) => {
    setHistoryWorker(worker);
    setHistoryModal(true);
    setFetchingHistory(true);
    try {
      const res = await API.get(`/attendance/history/${worker._id}`);
      if (res.data.success) {
        setHistoryLogs(res.data.data.attendance || []);
        setPaymentLogs(res.data.data.payments || []);
      }
    } catch {
      Alert.alert("Error", "Failed to load worker history.");
    } finally {
      setFetchingHistory(false);
    }
  };

  useEffect(() => { 
    if (user?.role === 'Worker') {
      openHistory(user);
    } else {
      fetchData(); 
    }
  }, []);
  
  useEffect(() => { 
    if (user?.role !== 'Worker') fetchSiteStats(selectedSiteId); 
  }, [selectedSiteId]);

  const toggleAttendance = (workerId) => {
    setAttendanceData((prev) => ({
      ...prev,
      [workerId]: {
        ...prev[workerId],
        present: !prev[workerId]?.present,
        overtime: prev[workerId]?.present ? 0 : prev[workerId]?.overtime || 0,
      },
    }));
  };

  const handleSave = async () => {
    const records = Object.entries(attendanceData)
      .filter(([_, d]) => d.present)
      .map(([workerId, d]) => ({
        workerId,
        siteId: selectedSiteId,
        date,
        hoursWorked: 8,
        overtimeHours: d.overtime || 0,
        remark: d.remark || "",
      }));

    if (records.length === 0) {
      return Alert.alert("No Selection", "Mark at least one worker as present.");
    }

    setSaving(true);
    let successCount = 0;
    for (const record of records) {
      try {
        await API.post("/attendance/mark", record);
        successCount++;
      } catch {}
    }
    setSaving(false);
    setAttendanceData({});
    fetchSiteStats(selectedSiteId);
    Alert.alert("Done", `Marked attendance for ${successCount} workers.`);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.siteId === selectedSiteId &&
      w._id !== user?._id && // Exclude current user (Admin) from list
      (w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.phone.includes(searchTerm))
  );

  const presentCount = Object.values(attendanceData).filter((d) => d.present).length;
  const activeSite = sites.find((s) => s._id === selectedSiteId);

  if (user?.role === 'Worker') {
    return (
      <ScreenWrapper>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Attendance</Text>
            <Text style={styles.subtitle}>View your work history & calendar</Text>
          </View>
        </View>

        {fetchingHistory ? (
          <View style={styles.loaderContainer}>
            <Loader message="Loading History..." />
          </View>
        ) : (
          <View style={{ flex: 1, padding: 16 }}>
            {/* View Switcher */}
            <View style={styles.viewSwitcher}>
              <TouchableOpacity 
                style={[styles.switchBtn, viewType === 'calendar' && styles.switchBtnActive]} 
                onPress={() => setViewType('calendar')}
              >
                <Ionicons name="calendar" size={18} color={viewType === 'calendar' ? "#fff" : COLORS.mutedForeground} />
                <Text style={[styles.switchText, viewType === 'calendar' && styles.switchTextActive]}>Calendar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.switchBtn, viewType === 'list' && styles.switchBtnActive]} 
                onPress={() => setViewType('list')}
              >
                <Ionicons name="list" size={18} color={viewType === 'list' ? "#fff" : COLORS.mutedForeground} />
                <Text style={[styles.switchText, viewType === 'list' && styles.switchTextActive]}>Timeline</Text>
              </TouchableOpacity>
            </View>

            {viewType === "calendar" ? (
              <GlassCard level={2} style={styles.customCalendarCard}>
                {/* Month Year Header */}
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => {
                    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                    setCurrentMonth(prev);
                  }}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.calendarHeaderText}>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => {
                    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                    setCurrentMonth(next);
                  }}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {/* Day Labels */}
                <View style={styles.daysRow}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <Text key={idx} style={styles.dayLabel}>{day}</Text>
                  ))}
                </View>

                {/* Grid Implementation */}
                <View style={styles.calendarGrid}>
                  {(() => {
                    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                    const days = [];
                    for (let i = 0; i < start.getDay(); i++) days.push(null);
                    for (let d = 1; d <= end.getDate(); d++) {
                      const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toISOString().split('T')[0];
                      const hasAttendance = historyLogs.some(l => new Date(l.date).toISOString().split('T')[0] === dateStr);
                      const hasPayment = paymentLogs.some(p => new Date(p.createdAt).toISOString().split('T')[0] === dateStr);
                      const isToday = new Date().toISOString().split('T')[0] === dateStr;
                      days.push({ day: d, hasAttendance, hasPayment, isToday });
                    }
                    return days.map((item, idx) => (
                      <View key={idx} style={styles.calendarDaySlot}>
                        {item && (
                          <View style={[
                            styles.dayCircle, 
                            item.hasAttendance && { backgroundColor: "rgba(34, 197, 94, 0.15)", borderColor: COLORS.green, borderWidth: 1 },
                            item.isToday && { borderColor: COLORS.primary, borderWidth: 1.5 }
                          ]}>
                            <Text style={[
                              styles.dayText,
                              item.hasAttendance && { color: COLORS.green, fontWeight: '800' },
                              item.isToday && { color: COLORS.primary, fontWeight: '800' }
                            ]}>
                              {item.day}
                            </Text>
                          </View>
                        )}
                      </View>
                    ));
                  })()}
                </View>
                <View style={styles.legend}>
                  <View style={styles.legendItem}>
                    <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                    <Text style={styles.legendText}>Present</Text>
                  </View>
                </View>
              </GlassCard>
            ) : (
              <FlatList
                data={historyLogs.sort((a, b) => new Date(b.date) - new Date(a.date))}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                  <GlassCard level={2} style={styles.workerListItemCard}>
                    <View style={styles.workerListText}>
                      <Text style={styles.workerListItemName}>
                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </Text>
                      <Text style={styles.workerListItemMeta}>{item.siteId?.name || 'On-Site'}</Text>
                    </View>
                    <StatusBadge color={COLORS.green} bgColor={COLORS.greenLight}>
                      {item.hoursWorked} Hrs
                    </StatusBadge>
                  </GlassCard>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No attendance history found.</Text>}
              />
            )}
          </View>
        )}
      </ScreenWrapper>
    );
  }

  if (loading) {
    return (
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Synchronizing Workforce..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title}>Attendance protocol</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Site: <Text style={styles.bold}>{activeSite?.name || "Select a site"}</Text>
          </Text>
        </View>
        <FuturisticButton
          onPress={handleSave}
          loading={saving}
          icon={<Ionicons name="save-outline" size={18} color="#fff" />}
          style={styles.saveBtn}
        >
          Submit
        </FuturisticButton>
      </View>

      {/* Site Pills */}
      <View style={{ height: 60 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sitePills}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 10 }}
        >
          {sites.map((site) => {
            const isActive = site._id === selectedSiteId;
            return (
              <TouchableOpacity
                key={site._id}
                style={[styles.sitePill, isActive && styles.sitePillActive]}
                onPress={() => setSelectedSiteId(site._id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sitePillText, isActive && styles.sitePillTextActive]}>
                  {site.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search + Stats Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={18} color={COLORS.mutedForeground} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchText}
            placeholder="Search workers..."
            placeholderTextColor={COLORS.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <StatusBadge color={COLORS.green} bgColor={COLORS.greenLight}>
          {presentCount} Present
        </StatusBadge>
      </View>

      {/* Worker List */}
      {filteredWorkers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={COLORS.mutedForeground} />
          <Text style={styles.emptyTitle}>No Workers Found</Text>
          <Text style={styles.emptyDesc}>Adjust site selection or search query.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 24, gap: 14, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: worker }) => {
            const d = attendanceData[worker._id] || { present: false, overtime: 0 };
            return (
              <GlassCard level={d.present ? 2 : 1} style={[styles.workerCard, d.present && styles.workerCardActive]}>
                <View style={styles.workerRowParent}>
                  <TouchableOpacity 
                    style={styles.workerRow} 
                    onPress={() => openHistory(worker)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.avatar, { backgroundColor: d.present ? COLORS.primary : "rgba(255, 255, 255, 0.08)" }]}>
                      <Text style={styles.avatarText}>{worker.name[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text style={styles.workerMeta}>
                        {worker.workerType || worker.role} • {worker.phone}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleBtn, d.present ? styles.toggleBtnPresent : styles.toggleBtnAbsent]}
                    onPress={() => toggleAttendance(worker._id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={d.present ? "checkmark-circle" : "ellipse-outline"}
                      size={24}
                      color={d.present ? "#fff" : COLORS.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>

                {d.present && (
                  <View style={styles.overtimeRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.overtimeLabel}>Overtime Hrs:</Text>
                    <TextInput
                      style={styles.overtimeInput}
                      keyboardType="numeric"
                      value={String(d.overtime || "")}
                      onChangeText={(v) =>
                        setAttendanceData((prev) => ({
                          ...prev,
                          [worker._id]: { ...prev[worker._id], overtime: parseFloat(v) || 0 },
                        }))
                      }
                      placeholder="0"
                      placeholderTextColor={COLORS.mutedForeground}
                    />
                    <TouchableOpacity
                      style={styles.historyBtn}
                      onPress={() => openHistory(worker)}
                    >
                      <Ionicons name="eye-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                )}
              </GlassCard>
            );
          }}
        />
      )}

      {/* History Modal */}
      <Modal
        visible={historyModal}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.avatarText}>{(historyWorker?.name?.[0] || "").toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={styles.modalTitle}>{historyWorker?.name}</Text>
                  <Text style={styles.modalSub}>Past 30 Days Records</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setHistoryModal(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {fetchingHistory ? (
              <View style={styles.modalLoader}>
                <Loader message="Fetching Archives..." />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* View Switcher */}
                <View style={styles.viewSwitcher}>
                  <TouchableOpacity 
                    style={[styles.switchBtn, viewType === 'calendar' && styles.switchBtnActive]} 
                    onPress={() => setViewType('calendar')}
                  >
                    <Ionicons name="calendar" size={18} color={viewType === 'calendar' ? "#fff" : COLORS.mutedForeground} />
                    <Text style={[styles.switchText, viewType === 'calendar' && styles.switchTextActive]}>Calendar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.switchBtn, viewType === 'list' && styles.switchBtnActive]} 
                    onPress={() => setViewType('list')}
                  >
                    <Ionicons name="list" size={18} color={viewType === 'list' ? "#fff" : COLORS.mutedForeground} />
                    <Text style={[styles.switchText, viewType === 'list' && styles.switchTextActive]}>Timeline</Text>
                  </TouchableOpacity>
                </View>

                {viewType === "calendar" ? (
                  <View style={styles.customCalendarContainer}>
                    {/* Month Year Header */}
                    <View style={styles.calendarHeader}>
                      <TouchableOpacity onPress={() => {
                        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                        setCurrentMonth(prev);
                      }}>
                        <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                      <Text style={styles.calendarHeaderText}>
                        {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity onPress={() => {
                        const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                        setCurrentMonth(next);
                      }}>
                        <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>

                    {/* Day Labels */}
                    <View style={styles.daysRow}>
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                        <Text key={idx} style={styles.dayLabel}>{day}</Text>
                      ))}
                    </View>

                    {/* Grid Implementation */}
                    <View style={styles.calendarGrid}>
                      {(() => {
                        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
                        const days = [];
                        
                        // Padding for start of month
                        for (let i = 0; i < start.getDay(); i++) days.push(null);
                        
                        // Days of month
                        for (let d = 1; d <= end.getDate(); d++) {
                          const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d).toISOString().split('T')[0];
                          const hasAttendance = historyLogs.some(l => new Date(l.date).toISOString().split('T')[0] === dateStr);
                          const hasPayment = paymentLogs.some(p => new Date(p.createdAt).toISOString().split('T')[0] === dateStr);
                          
                          const isToday = new Date().toISOString().split('T')[0] === dateStr;
                          days.push({ day: d, hasAttendance, hasPayment, isToday });
                        }

                        return days.map((item, idx) => (
                          <View key={idx} style={styles.calendarDaySlot}>
                            {item && (
                              <View style={[
                                styles.dayCircle, 
                                item.hasAttendance && { backgroundColor: "rgba(34, 197, 94, 0.12)", borderColor: COLORS.green, borderWidth: 1 },
                                item.isToday && { borderColor: COLORS.primary, borderWidth: 1.5 }
                              ]}>
                                <Text style={[
                                  styles.dayText,
                                  item.hasAttendance && { color: COLORS.green, fontWeight: '800' },
                                  item.isToday && { color: COLORS.primary }
                                ]}>
                                  {item.day}
                                </Text>
                                <View style={styles.dotContainer}>
                                  {item.hasAttendance && <View style={[styles.miniDot, { backgroundColor: COLORS.green }]} />}
                                  {item.hasPayment && <View style={[styles.miniDot, { backgroundColor: COLORS.primary }]} />}
                                </View>
                              </View>
                            )}
                          </View>
                        ));
                      })()}
                    </View>

                    <View style={styles.legend}>
                      <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: COLORS.green }]} />
                        <Text style={styles.legendText}>Present</Text>
                      </View>
                      <View style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
                        <Text style={styles.legendText}>Payment</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <FlatList
                    data={[
                      ...historyLogs.map(l => ({ ...l, type: 'attendance' })),
                      ...paymentLogs.map(p => ({ ...p, type: 'payment', date: p.createdAt }))
                    ].sort((a, b) => new Date(b.date) - new Date(a.date))}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 16, gap: 10 }}
                    renderItem={({ item }) => (
                      <View style={[styles.logRow, item.type === 'payment' && styles.logRowPayment]}>
                        <View style={[styles.logIconBox, item.type === 'payment' && { backgroundColor: COLORS.primaryLight }]}>
                          <Ionicons 
                            name={item.type === 'attendance' ? "calendar-outline" : "cash-outline"} 
                            size={18} 
                            color={item.type === 'attendance' ? COLORS.primary : COLORS.green} 
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logDate}>
                            {new Date(item.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </Text>
                          <Text style={styles.logSite}>
                            {item.type === 'attendance' ? (item.siteId?.name || "On Site") : `Disbursement recorded`}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={[styles.logPresent, item.type === 'payment' && { color: COLORS.primary }]}>
                            {item.type === 'attendance' ? "Present" : `₹${item.paidAmount}`}
                          </Text>
                          {item.overtimeHours > 0 && (
                            <Text style={styles.logOvertime}>+{item.overtimeHours}h OT</Text>
                          )}
                        </View>
                      </View>
                    )}
                  />
                )}
              </View>
            )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 12,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
  },
  title: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: { color: COLORS.mutedForeground, fontSize: 13, marginTop: 2 },
  bold: { color: COLORS.foreground, fontWeight: "800" },
  saveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  sitePills: { paddingVertical: 8 },
  sitePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    backgroundColor: "rgba(26, 26, 36, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  sitePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  sitePillText: { color: COLORS.mutedForeground, fontWeight: "800", fontSize: 13 },
  sitePillTextActive: { color: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 64 },
  emptyTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyDesc: { color: COLORS.mutedForeground, fontSize: 13 },
  workerCard: {
    padding: 0,
  },
  workerCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(124, 111, 247, 0.06)",
  },
  workerRowParent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  workerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
  },
  workerInfo: { flex: 1 },
  workerName: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  workerMeta: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.xl,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  toggleBtnPresent: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  toggleBtnAbsent: {
    backgroundColor: "rgba(26, 26, 36, 0.4)",
  },
  overtimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  overtimeLabel: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  overtimeInput: {
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: COLORS.foreground,
    fontWeight: "800",
    fontSize: 14,
    width: 60,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  historyBtn: {
    marginLeft: "auto",
    padding: 8,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
    borderColor: "rgba(124, 111, 247, 0.3)",
    borderWidth: 1,
    borderRadius: RADIUS.md,
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
    maxHeight: "85%",
    borderTopWidth: 1.5,
    borderColor: "rgba(124, 111, 247, 0.3)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "900" },
  modalSub: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalLoader: {
    height: 250,
    alignItems: "center",
    justifyContent: "center",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 10,
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(34, 197, 94, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  logDate: { color: COLORS.foreground, fontWeight: "800", fontSize: 14 },
  logSite: { color: COLORS.mutedForeground, fontSize: 11, marginTop: 2 },
  logPresent: { color: COLORS.green, fontWeight: "800", fontSize: 14 },
  logOvertime: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
  },
  viewSwitcher: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  switchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(26, 26, 36, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  switchBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  switchText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.mutedForeground,
  },
  switchTextActive: {
    color: "#fff",
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.mutedForeground, fontSize: 12, fontWeight: "800" },
  logRowPayment: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  customCalendarCard: {
    padding: 0,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  calendarHeaderText: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: "900",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  dayLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    width: 40,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDaySlot: {
    width: "14.28%", // 7 days
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.foreground,
  },
  dotContainer: {
    flexDirection: "row",
    gap: 2,
    position: "absolute",
    bottom: 2,
  },
  miniDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  customCalendarContainer: {
    padding: 18,
  },
  workerListItemCard: {
    padding: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  workerListText: {
    flex: 1,
  },
  workerListItemName: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "800",
  },
  workerListItemMeta: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    marginTop: 2,
  },
});
