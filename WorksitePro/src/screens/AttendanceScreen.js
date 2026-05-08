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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

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
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>My Attendance</Text>
            <Text style={styles.subtitle}>View your work history & calendar</Text>
          </View>
        </View>

        {fetchingHistory ? (
          <View style={styles.loader}>
            <ActivityIndicator color={COLORS.primary} size="large" />
            <Text style={styles.loaderText}>Loading History...</Text>
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
              <View style={[styles.customCalendarContainer, { backgroundColor: COLORS.card, padding: 16, borderRadius: RADIUS.xl }]}>
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
                            item.hasAttendance && { backgroundColor: COLORS.green + '20' },
                            item.isToday && { borderColor: COLORS.primary, borderWidth: 1 }
                          ]}>
                            <Text style={[
                              styles.dayText,
                              item.hasAttendance && { color: COLORS.green, fontWeight: '800' },
                              item.isToday && { color: COLORS.primary }
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
              </View>
            ) : (
              <FlatList
                data={historyLogs.sort((a, b) => new Date(b.date) - new Date(a.date))}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <View style={[styles.workerCard, { flexDirection: 'row', justifyContent: 'space-between' }]}>
                    <View>
                      <Text style={styles.workerName}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
                      <Text style={styles.workerMeta}>{item.siteId?.name || 'On-Site'}</Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{item.hoursWorked} Hrs</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No attendance history found.</Text>}
              />
            )}
          </View>
        )}
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loaderText}>Synchronizing Workforce...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Attendance Protocol</Text>
          <Text style={styles.subtitle}>
            Site:{" "}
            <Text style={styles.bold}>{activeSite?.name || "Select a site"}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Submit</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Site Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sitePills}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
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
              <Text
                style={[styles.sitePillText, isActive && styles.sitePillTextActive]}
              >
                {site.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search + Stats Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={COLORS.mutedForeground} />
          <TextInput
            style={styles.searchText}
            placeholder="Search workers..."
            placeholderTextColor={COLORS.mutedForeground}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <View style={styles.countBadge}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.green} />
          <Text style={styles.countText}>{presentCount} Present</Text>
        </View>
      </View>

      {/* Worker List */}
      {filteredWorkers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={COLORS.mutedForeground} />
          <Text style={styles.emptyTitle}>No Workers Found</Text>
          <Text style={styles.emptyDesc}>Adjust site selection or search.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: worker }) => {
            const d = attendanceData[worker._id] || { present: false, overtime: 0 };
            return (
              <View
                style={[styles.workerCard, d.present && styles.workerCardActive]}
              >
                <View style={styles.workerRowParent}>
                  <TouchableOpacity 
                    style={styles.workerRow} 
                    onPress={() => openHistory(worker)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: d.present ? COLORS.primary : COLORS.muted },
                      ]}
                    >
                      <Text style={styles.avatarText}>{worker.name[0]}</Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{worker.name}</Text>
                      <Text style={styles.workerMeta}>
                        {worker.workerType || worker.role} • {worker.phone}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toggleBtn,
                      d.present ? styles.toggleBtnPresent : styles.toggleBtnAbsent,
                    ]}
                    onPress={() => toggleAttendance(worker._id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={d.present ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={d.present ? "#fff" : COLORS.mutedForeground}
                    />
                  </TouchableOpacity>
                </View>

                {d.present && (
                  <View style={styles.overtimeRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.mutedForeground} />
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
              </View>
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
                  <Text style={styles.avatarText}>{historyWorker?.name?.[0]}</Text>
                </View>
                <View>
                  <Text style={styles.modalTitle}>{historyWorker?.name}</Text>
                  <Text style={styles.modalSub}>Attendance Archive • Past 30 Days</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setHistoryModal(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {fetchingHistory ? (
              <View style={styles.modalLoader}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.loaderText}>Processing Archives...</Text>
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
                                item.hasAttendance && { backgroundColor: COLORS.green + '20' },
                                item.isToday && { borderColor: COLORS.primary, borderWidth: 1 }
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    color: COLORS.foreground,
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: { color: COLORS.mutedForeground, fontSize: 13, marginTop: 2 },
  bold: { color: COLORS.foreground, fontWeight: "700" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    ...SHADOW.primary,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  sitePills: { paddingVertical: 8 },
  sitePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  sitePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
    ...SHADOW.primary,
  },
  sitePillText: { color: COLORS.mutedForeground, fontWeight: "700", fontSize: 13 },
  sitePillTextActive: { color: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    height: 44,
  },
  searchText: { flex: 1, color: COLORS.foreground, fontSize: 14 },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.greenLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
  },
  countText: { color: COLORS.green, fontWeight: "800", fontSize: 12 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  emptyTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyDesc: { color: COLORS.mutedForeground, fontSize: 13 },
  workerCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  workerCardActive: {
    borderColor: COLORS.primary + "60",
    backgroundColor: COLORS.primaryLight,
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
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  toggleBtnPresent: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  toggleBtnAbsent: {
    backgroundColor: COLORS.card,
  },
  overtimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  overtimeLabel: {
    color: COLORS.mutedForeground,
    fontSize: 12,
    fontWeight: "600",
  },
  overtimeInput: {
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 4,
    color: COLORS.foreground,
    fontWeight: "800",
    fontSize: 14,
    width: 60,
  },
  historyBtn: {
    marginLeft: "auto",
    padding: 6,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "900" },
  modalSub: {
    color: COLORS.mutedForeground,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  modalLoader: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.lg,
    padding: 14,
  },
  logIconBox: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  logDate: { color: COLORS.foreground, fontWeight: "800", fontSize: 14 },
  logSite: { color: COLORS.mutedForeground, fontSize: 11, marginTop: 2 },
  logPresent: { color: COLORS.green, fontWeight: "800", fontSize: 13 },
  logOvertime: {
    color: COLORS.orange,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  viewSwitcher: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  switchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.muted,
  },
  switchBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOW.primary,
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
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.mutedForeground, fontSize: 12, fontWeight: "700" },
  logRowPayment: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  customCalendarContainer: {
    padding: 16,
    backgroundColor: COLORS.card,
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
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontSize: 14,
    fontWeight: "600",
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
});
