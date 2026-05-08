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
  useWindowDimensions,
} from "react-native";
import { useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import API from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

export default function SiteDetailsScreen({ route, navigation }) {
  const { user } = useAuth();
  const { siteId, siteName } = route.params;
  const [loading, setLoading] = useState(true);
  const [siteData, setSiteData] = useState(null);
  const [workers, setWorkers] = useState([]);
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
  const [deleteStep, setDeleteStep] = useState(1); // 1: Initial, 2: OTP
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/sites/stats/${siteId}`);
      if (res.data.success) {
        setSiteData(res.data.data);
        // Assuming workers are in the stats or need another call
        // Let's check backend if possible, but frontend uses API.get("/owners/workers")
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
      Alert.alert("Error", typeof e === "string" ? e : "Failed to remove worker.");
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveWorker = async (workerId) => {
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

  const handleRequestDelete = async () => {
    try {
      setDeleting(true);
      const res = await API.post(`/sites/request-delete/${siteId}`);
      if (res.data.success) {
        setDeleteStep(2);
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to send OTP.");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteOtp.length !== 6) return Alert.alert("Invalid OTP", "Please enter 6-digit OTP.");
    
    try {
      setDeleting(true);
      const res = await API.delete(`/sites/confirm-delete/${siteId}`, { data: { otp: deleteOtp } });
      if (res.data.success) {
        setDeleteModalVisible(false);
        Alert.alert("Deleted", "Site has been permanently deleted.");
        navigation.navigate("Dashboard");
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Invalid OTP or deletion failed.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !siteData) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const filteredAvailable = availableWorkers.filter(w => 
    (w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     w.phone.includes(searchQuery)) && 
    w.siteId !== siteId
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{siteName}</Text>
        {user?.role === "Owner" && (
          <TouchableOpacity 
            style={styles.settingsBtn}
            onPress={() => setDeleteModalVisible(true)}
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
            style={styles.statBox}
            onPress={() => setWorkersModalVisible(true)}
          >
            <Text style={styles.statVal}>{siteData?.totalWorkersOnSite || 0}</Text>
            <Text style={styles.statLab}>Assigned Workers</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => {
              const siteWorkers = availableWorkers.filter(w => w.siteId === siteId);
              if (siteWorkers.length === 0) {
                return Alert.alert("No Workers", "Assign workers to this site first.");
              }
              setAttendanceModalVisible(true);
            }}
          >
            <Text style={styles.statVal}>{siteData?.attendanceToday || 0}</Text>
            <Text style={styles.statLab}>Attendance Today</Text>
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
              >
                <Text style={styles.inlineAddText}>+ Assign</Text>
              </TouchableOpacity>
            )}
          </View>

          {availableWorkers.filter(w => w.siteId?.toString() === siteId?.toString()).length > 0 ? (
            availableWorkers.filter(w => w.siteId?.toString() === siteId?.toString()).map((worker) => (
              <View key={worker._id} style={styles.workerCard}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.avatarText}>{worker.name[0]}</Text>
                </View>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>{worker.name}</Text>
                  <Text style={styles.workerRole}>{worker.workerType || "Worker"} • {worker.phone}</Text>
                </View>
                {user?.role === "Owner" && (
                  <TouchableOpacity onPress={() => handleRemoveWorker(worker._id)}>
                    <Ionicons name="remove-circle-outline" size={24} color={COLORS.red} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyWorkers}>
              <Text style={styles.emptyText}>No workers assigned to this site yet.</Text>
            </View>
          )}
        </View>

        {/* Generate Site Report */}
        <TouchableOpacity 
          style={[styles.actionCard, exporting && { opacity: 0.7 }]}
          onPress={handleGenerateReport}
          disabled={exporting}
        >
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
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Active Personnel</Text>
              <TouchableOpacity onPress={() => setWorkersModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableWorkers.filter(w => w.siteId?.toString() === siteId?.toString())}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.workerCard}>
                  <View style={styles.workerAvatar}>
                    <Text style={styles.avatarText}>{item.name[0]}</Text>
                  </View>
                  <View style={styles.workerInfo}>
                    <Text style={styles.workerName}>{item.name}</Text>
                    <Text style={styles.workerRole}>{item.workerType} • {item.phone}</Text>
                  </View>
                  {user?.role === "Owner" && (
                    <TouchableOpacity onPress={() => {
                      setWorkersModalVisible(false);
                      handleRemoveWorker(item._id);
                    }}>
                      <Ionicons name="trash-outline" size={20} color={COLORS.red} />
                    </TouchableOpacity>
                  )}
                </View>
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
                <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
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
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.availableRow}
                  onPress={() => handleAssignWorker(item._id)}
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
          <View style={[styles.modalContent, { maxHeight: "80%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Attendance</Text>
              <TouchableOpacity onPress={() => setAttendanceModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Worker</Text>
            <FlatList
              data={availableWorkers.filter(w => w.siteId?.toString() === siteId?.toString())}
              keyExtractor={(item) => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 20 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.workerPicker, 
                    selectedWorkerForAttendance?._id === item._id && styles.workerPickerActive
                  ]}
                  onPress={() => setSelectedWorkerForAttendance(item)}
                >
                  <View style={styles.pickerAvatar}>
                    <Text style={styles.pickerAvatarText}>{item.name[0]}</Text>
                  </View>
                  <Text style={styles.pickerName} numberOfLines={1}>{item.name.split(" ")[0]}</Text>
                </TouchableOpacity>
              )}
            />

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
                />

                <TouchableOpacity 
                  style={[styles.submitBtn, marking && { opacity: 0.7 }]}
                  onPress={handleMarkAttendance}
                  disabled={marking}
                >
                  {marking ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Confirm Attendance</Text>}
                </TouchableOpacity>
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
                setDeleteStep(1);
                setDeleteOtp("");
              }}>
                <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            {deleteStep === 1 ? (
              <View>
                <Text style={styles.deleteWarning}>
                  Are you sure you want to delete <Text style={{fontWeight: '900'}}>{siteName}</Text>? 
                  This action is permanent and cannot be undone.
                </Text>
                <TouchableOpacity 
                  style={[styles.deleteBtn, deleting && { opacity: 0.7 }]}
                  onPress={handleRequestDelete}
                  disabled={deleting}
                >
                  {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteBtnText}>Request Deletion OTP</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.otpInfo}>
                  Enter the 6-digit OTP sent to your registered phone number to confirm deletion.
                </Text>
                <TextInput
                  style={styles.otpInput}
                  placeholder="000000"
                  keyboardType="numeric"
                  maxLength={6}
                  value={deleteOtp}
                  onChangeText={setDeleteOtp}
                  placeholderTextColor={COLORS.mutedForeground}
                />
                <TouchableOpacity 
                  style={[styles.confirmDeleteBtn, deleting && { opacity: 0.7 }]}
                  onPress={handleConfirmDelete}
                  disabled={deleting}
                >
                  {deleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteBtnText}>Confirm Permanent Deletion</Text>}
                </TouchableOpacity>
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
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 20, 
    justifyContent: "space-between" 
  },
  backBtn: { padding: 4 },
  pageTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: "900", flex: 1, marginLeft: 12 },
  settingsBtn: { padding: 4 },
  scroll: { padding: 20 },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statBox: { 
    flex: 1, 
    backgroundColor: COLORS.card, 
    borderRadius: RADIUS.xl, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    ...SHADOW.card
  },
  statVal: { color: COLORS.foreground, fontSize: 24, fontWeight: "900" },
  statLab: { color: COLORS.mutedForeground, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: 4 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { color: COLORS.foreground, fontSize: 18, fontWeight: "800" },
  inlineAddBtn: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full },
  inlineAddText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  workerCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: COLORS.card, 
    padding: 12, 
    borderRadius: RADIUS.lg, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  workerAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: COLORS.primaryLight, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  avatarText: { color: COLORS.primary, fontWeight: "800", fontSize: 16 },
  workerInfo: { flex: 1, marginLeft: 12 },
  workerName: { color: COLORS.foreground, fontSize: 15, fontWeight: "700" },
  workerRole: { color: COLORS.mutedForeground, fontSize: 12 },
  emptyWorkers: { padding: 40, alignItems: "center" },
  emptyText: { color: COLORS.mutedForeground, fontSize: 14, textAlign: "center" },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card
  },
  actionTitle: { color: COLORS.foreground, fontSize: 15, fontWeight: "700" },
  actionDesc: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: "900" },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 14,
    color: COLORS.foreground,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  availableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  availName: { color: COLORS.foreground, fontSize: 15, fontWeight: "700" },
  availMeta: { color: COLORS.mutedForeground, fontSize: 12 },
  emptySearch: { textAlign: "center", padding: 20, color: COLORS.mutedForeground },
  workerPicker: {
    alignItems: "center",
    marginRight: 16,
    width: 70,
    opacity: 0.6,
  },
  workerPickerActive: {
    opacity: 1,
  },
  pickerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  pickerAvatarText: {
    color: COLORS.primary,
    fontWeight: "800",
    fontSize: 18,
  },
  pickerName: {
    color: COLORS.foreground,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  attendanceForm: {
    gap: 16,
  },
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 12,
    color: COLORS.foreground,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  deleteWarning: {
    color: COLORS.foreground,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  deleteBtn: {
    backgroundColor: COLORS.red,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  otpInfo: {
    color: COLORS.mutedForeground,
    fontSize: 13,
    marginBottom: 16,
  },
  otpInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    padding: 16,
    color: COLORS.foreground,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  confirmDeleteBtn: {
    backgroundColor: '#000',
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  }
});
