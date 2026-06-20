import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { useRef } from "react";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";
import FuturisticButton from "../components/FuturisticButton";
import StatusBadge from "../components/StatusBadge";

export default function SiteDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { siteId, siteName } = route.params;
  const [loading, setLoading] = useState(true);
  const [siteData, setSiteData] = useState(null);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const workforceRef = useRef(null);
  
  // Modals
  const [isAssignModalVisible, setAssignModalVisible] = useState(false);
  const [isWorkersModalVisible, setWorkersModalVisible] = useState(false);
  const [isAttendanceModalVisible, setAttendanceModalVisible] = useState(false);
  const [selectedWorkerForAttendance, setSelectedWorkerForAttendance] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({ 
    hoursWorked: "8", 
    overtimeHours: "0", 
    remark: "" 
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [marking, setMarking] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Deletion state
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/sites/stats/${siteId}`);
      if (res.data.success) {
        setSiteData(res.data.data);
      }
      
      const workersRes = await API.get("/owners/workers");
      if (workersRes.data.success) {
        setAvailableWorkers(workersRes.data.data);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load site details.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!selectedWorkerForAttendance) return;
    
    try {
      setMarking(true);
      const res = await API.post("/attendance/mark", {
        workerId: selectedWorkerForAttendance._id,
        siteId,
        hoursWorked: Number(attendanceForm.hoursWorked),
        overtimeHours: Number(attendanceForm.overtimeHours),
        date: new Date().toISOString(),
        remark: attendanceForm.remark
      });
      
      if (res.data.success) {
        Alert.alert("Success", `Attendance marked for ${selectedWorkerForAttendance.name}`);
        setAttendanceModalVisible(false);
        setSelectedWorkerForAttendance(null);
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to mark attendance.");
    } finally {
      setMarking(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssignWorker = async (workerId) => {
    try {
      setAssigning(true);
      const res = await API.patch(`/sites/assign-worker/${siteId}`, { workerId });
      if (res.data.success) {
        Alert.alert("Success", "Worker assigned successfully.");
        fetchData();
        setAssignModalVisible(false);
      }
    } catch (e) {
      Alert.alert("Error", typeof e === "string" ? e : (e.message || "Failed to assign worker."));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveWorker = async (workerId) => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to remove this worker from this site?")) {
        try {
          const res = await API.patch(`/sites/remove-worker/${siteId}`, { workerId });
          if (res.data.success) {
            fetchData();
          }
        } catch (e) {
          alert("Failed to remove worker.");
        }
      }
    } else {
      Alert.alert(
        "Remove Worker",
        "Are you sure you want to remove this worker from this site?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Remove", 
            style: "destructive", 
            onPress: async () => {
              try {
                const res = await API.patch(`/sites/remove-worker/${siteId}`, { workerId });
                if (res.data.success) {
                  fetchData();
                }
              } catch (e) {
                Alert.alert("Error", "Failed to remove worker.");
              }
            }
          }
        ]
      );
    }
  };

  const handleGenerateReport = async () => {
    try {
      setExporting(true);
      
      // Fetch data for report
      const res = await API.get(`/sites/report-data/${siteId}`);
      if (!res.data.success) throw new Error("Failed to fetch report data");
      
      const { site, reportData } = res.data.data;
      
      // Build HTML Template
      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .title { font-size: 24px; font-weight: bold; }
              .site-info { margin-bottom: 30px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f2f2f2; text-align: left; padding: 10px; border-bottom: 1px solid #ddd; }
              td { padding: 10px; border-bottom: 1px solid #ddd; }
              .footer { text-align: center; font-size: 10px; color: #666; margin-top: 50px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="title">WorksitePro Site Report</div>
              <div>Modern Workforce Management</div>
            </div>
            
            <div class="site-info">
              <p><strong>Site Name:</strong> ${site.name}</p>
              <p><strong>Location:</strong> ${site.location}</p>
              <p><strong>Generated On:</strong> ${new Date().toLocaleDateString()}</p>
              <p><strong>Total Workers:</strong> ${reportData.length}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Worker Name</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Earnings (Est)</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.map(w => `
                  <tr>
                    <td>${w.name}</td>
                    <td>${w.workerType}</td>
                    <td>${w.phone}</td>
                    <td>Rs. ${w.earnings}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="footer">
              Generated by WorksitePro App
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      
      // Share
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      
    } catch (e) {
      console.error(e);
      Alert.alert("Export Error", "Failed to generate report.");
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setDeleting(true);
      const res = await API.delete(`/sites/confirm-delete/${siteId}`);
      if (res.data.success) {
        setDeleteModalVisible(false);
        Alert.alert("Deleted", "Site has been permanently deleted.");
        navigation.navigate("Dashboard");
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Deletion failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !siteData) {
    return (
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Querying Site Intelligence..." />
      </ScreenWrapper>
    );
  }

  const filteredAvailable = availableWorkers.filter(w => 
    (w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     w.phone.includes(searchQuery)) && 
    w.siteId !== siteId
  );

  const assignedList = availableWorkers.filter(w => w.siteId?.toString() === siteId?.toString());

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.pageTitle} numberOfLines={1}>{siteName}</Text>
        {user?.role === "Owner" && (
          <TouchableOpacity 
            style={styles.settingsBtn}
            onPress={() => setDeleteModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={22} color={COLORS.red} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        ref={workforceRef}
        contentContainerStyle={styles.scroll} 
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statTouch}
            onPress={() => setWorkersModalVisible(true)}
            activeOpacity={0.85}
          >
            <GlassCard level={2} style={styles.statBox}>
              <Text style={styles.statVal}>{siteData?.totalWorkersOnSite || 0}</Text>
              <Text style={styles.statLab}>Assigned Workers</Text>
            </GlassCard>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statTouch}
            onPress={() => {
              if (assignedList.length === 0) {
                return Alert.alert("No Workers", "Assign workers to this site first.");
              }
              setAttendanceModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <GlassCard level={2} style={styles.statBox}>
              <Text style={styles.statVal}>{siteData?.attendanceToday || 0}</Text>
              <Text style={styles.statLab}>Attendance Today</Text>
            </GlassCard>
          </TouchableOpacity>
        </View>

        {/* Assigned Workforce */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Assigned Workforce</Text>
            {user?.role === "Owner" && (
              <TouchableOpacity 
                style={styles.inlineAddBtn}
                onPress={() => setAssignModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.inlineAddText}>+ Assign</Text>
              </TouchableOpacity>
            )}
          </View>

          {assignedList.length > 0 ? (
            assignedList.map((worker) => (
              <GlassCard level={2} key={worker._id} style={styles.workerCard}>
                <View style={styles.workerRow}>
                  <View style={styles.workerAvatar}>
                    <Text style={styles.avatarText}>{worker.name[0].toUpperCase()}</Text>
                  </View>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{worker.name}</Text>
                    <Text style={styles.workerRole}>{worker.workerType || "Worker"} • {worker.phone}</Text>
                  </View>
                  {user?.role === "Owner" && (
                    <TouchableOpacity onPress={() => handleRemoveWorker(worker._id)} activeOpacity={0.8}>
                      <Ionicons name="remove-circle-outline" size={24} color={COLORS.red} />
                    </TouchableOpacity>
                  )}
                </View>
              </GlassCard>
            ))
          ) : (
            <View style={styles.emptyWorkers}>
              <Text style={styles.emptyText}>No workers assigned to this site yet.</Text>
            </View>
          )}
        </View>

        {/* Generate Site Report */}
        <TouchableOpacity 
          style={styles.actionCardTouch}
          onPress={handleGenerateReport}
          disabled={exporting}
          activeOpacity={0.85}
        >
          <GlassCard level={2} style={styles.actionCard}>
            <View style={styles.actionRow}>
              {exporting ? (
                 <ActivityIndicator color={COLORS.primary} style={{ marginRight: 12 }} />
              ) : (
                <Ionicons name="document-text-outline" size={24} color={COLORS.primary} />
              )}
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionTitle}>Generate Site Report</Text>
                <Text style={styles.actionDesc}>
                  {exporting ? "Generating PDF..." : "Export attendance and wage summaries."}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.mutedForeground} />
            </View>
          </GlassCard>
        </TouchableOpacity>
      </ScrollView>

      {/* Workers List Modal */}
      <Modal
        visible={isWorkersModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWorkersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Personnel</Text>
              <TouchableOpacity onPress={() => setWorkersModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={assignedList}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ paddingVertical: 12 }}
              renderItem={({ item }) => (
                <GlassCard level={2} style={[styles.workerCard, { marginHorizontal: 0, marginBottom: 12 }]}>
                  <View style={styles.workerRow}>
                    <View style={styles.workerAvatar}>
                      <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
                    </View>
                    <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{item.name}</Text>
                      <Text style={styles.workerRole}>{item.workerType} • {item.phone}</Text>
                    </View>
                    {user?.role === "Owner" && (
                      <TouchableOpacity onPress={() => {
                        setWorkersModalVisible(false);
                        handleRemoveWorker(item._id);
                      }} activeOpacity={0.8}>
                        <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                      </TouchableOpacity>
                    )}
                  </View>
                </GlassCard>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No workers assigned yet.</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Assign Worker Modal */}
      <Modal
        visible={isAssignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deploy Personnel</Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={COLORS.mutedForeground}
            />

            <FlatList
              data={filteredAvailable}
              keyExtractor={(item) => item._id}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.availableRow}
                  onPress={() => handleAssignWorker(item._id)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.availName}>{item.name}</Text>
                    <Text style={styles.availMeta}>{item.workerType} • {item.phone}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptySearch}>No available workers found.</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* Mark Attendance Modal */}
      <Modal
        visible={isAttendanceModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAttendanceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Worker</Text>
            <View style={{ height: 90, marginBottom: 12 }}>
              <FlatList
                data={assignedList}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[
                      styles.workerPicker, 
                      selectedWorkerForAttendance?._id === item._id && styles.workerPickerActive
                    ]}
                    onPress={() => setSelectedWorkerForAttendance(item)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.pickerAvatar, selectedWorkerForAttendance?._id === item._id && { borderColor: COLORS.primary }]}>
                      <Text style={styles.pickerAvatarText}>{item.name[0].toUpperCase()}</Text>
                    </View>
                    <Text style={styles.pickerName} numberOfLines={1}>{item.name.split(" ")[0]}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {selectedWorkerForAttendance && (
              <View style={styles.attendanceForm}>
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Hours Worked</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={attendanceForm.hoursWorked}
                      onChangeText={(v) => setAttendanceForm({ ...attendanceForm, hoursWorked: v })}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Overtime (Hrs)</Text>
                    <TextInput
                      style={styles.formInput}
                      keyboardType="numeric"
                      value={attendanceForm.overtimeHours}
                      onChangeText={(v) => setAttendanceForm({ ...attendanceForm, overtimeHours: v })}
                    />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Remark (Optional)</Text>
                <TextInput
                  style={[styles.formInput, { height: 80, textAlignVertical: "top" }]}
                  placeholder="Shift notes..."
                  multiline
                  value={attendanceForm.remark}
                  onChangeText={(v) => setAttendanceForm({ ...attendanceForm, remark: v })}
                  placeholderTextColor={COLORS.mutedForeground}
                />

                <FuturisticButton
                  variant="primary"
                  onPress={handleMarkAttendance}
                  loading={marking}
                  style={styles.submitBtn}
                >
                  Confirm Attendance
                </FuturisticButton>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Delete Site Modal */}
      <Modal
        visible={isDeleteModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Delete Site</Text>
              <TouchableOpacity onPress={() => {
                setDeleteModalVisible(false);
              }}>
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View>
              <Text style={styles.deleteWarning}>
                Are you sure you want to delete <Text style={{ fontWeight: '900', color: COLORS.foreground }}>{siteName}</Text>? 
                This action is permanent and cannot be undone.
              </Text>
              <FuturisticButton
                variant="primary"
                onPress={handleConfirmDelete}
                loading={deleting}
                style={styles.deleteBtn}
              >
                Confirm Permanent Deletion
              </FuturisticButton>
            </View>
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
    alignItems: "center", 
    padding: 24, 
    justifyContent: "space-between",
    paddingTop: Platform.OS === "ios" ? 16 : 24,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(26,26,36,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  pageTitle: { color: COLORS.foreground, fontSize: 22, fontWeight: "900", flex: 1, marginLeft: 16, letterSpacing: -0.5 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  scroll: { padding: 24, paddingBottom: 110 },
  statsRow: { flexDirection: "row", gap: 14, marginBottom: 24 },
  statTouch: {
    flex: 1,
  },
  statBox: { 
    padding: 0,
  },
  statVal: { color: COLORS.foreground, fontSize: 26, fontWeight: "900" },
  statLab: { color: COLORS.mutedForeground, fontSize: 11, fontWeight: "800", textTransform: "uppercase", marginTop: 6, letterSpacing: 0.5 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "900" },
  inlineAddBtn: { backgroundColor: "rgba(124, 111, 247, 0.12)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: "rgba(124, 111, 247, 0.25)" },
  inlineAddText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  workerCard: { 
    marginBottom: 12,
    padding: 0,
  },
  workerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: RADIUS.md, 
    backgroundColor: "rgba(124, 111, 247, 0.15)", 
    alignItems: "center", 
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 111, 247, 0.3)",
  },
  avatarText: { color: COLORS.primary, fontWeight: "900", fontSize: 16 },
  workerInfo: { flex: 1, marginLeft: 12 },
  workerName: { color: COLORS.foreground, fontSize: 15, fontWeight: "800" },
  workerRole: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2, fontWeight: "500" },
  emptyWorkers: { padding: 40, alignItems: "center" },
  emptyText: { color: COLORS.mutedForeground, fontSize: 14, textAlign: "center", fontWeight: "600" },
  actionCardTouch: {
    marginBottom: 16,
  },
  actionCard: {
    padding: 0,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionTitle: { color: COLORS.foreground, fontSize: 15, fontWeight: "800" },
  actionDesc: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2, fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#0f0f14",
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1.5,
    borderColor: "rgba(124, 111, 247, 0.3)",
    maxHeight: "85%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  searchInput: {
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderRadius: RADIUS.xl,
    padding: 14,
    color: COLORS.foreground,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    fontWeight: "600",
  },
  availableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)"
  },
  availName: { color: COLORS.foreground, fontSize: 15, fontWeight: "800" },
  availMeta: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2 },
  emptySearch: { textAlign: "center", padding: 20, color: COLORS.mutedForeground, fontWeight: "600" },
  workerPicker: {
    alignItems: "center",
    marginRight: 16,
    width: 70,
    opacity: 0.5,
  },
  workerPickerActive: {
    opacity: 1,
  },
  pickerAvatar: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    backgroundColor: "rgba(124, 111, 247, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  pickerAvatarText: {
    color: COLORS.primary,
    fontWeight: "900",
    fontSize: 18,
  },
  pickerName: {
    color: COLORS.foreground,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  attendanceForm: {
    gap: 16,
    marginTop: 8,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  inputLabel: { color: COLORS.accentForeground, fontSize: 11, fontWeight: "800", marginBottom: 6, letterSpacing: 1, textTransform: "uppercase" },
  formInput: {
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderRadius: RADIUS.xl,
    padding: 12,
    color: COLORS.foreground,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    fontWeight: "600",
  },
  submitBtn: {
    marginTop: 10,
    width: "100%",
  },
  deleteWarning: {
    color: COLORS.foreground,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
    fontWeight: "500",
  },
  deleteBtn: {
    width: "100%",
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  },
  otpInfo: {
    color: COLORS.mutedForeground,
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
    fontWeight: "500",
  },
  otpInput: {
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderRadius: RADIUS.xl,
    padding: 16,
    color: COLORS.foreground,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
  },
  confirmDeleteBtn: {
    width: "100%",
    backgroundColor: COLORS.red,
    borderColor: COLORS.red,
  }
});
