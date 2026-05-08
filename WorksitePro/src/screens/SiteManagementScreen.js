import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

export default function SiteManagementScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [siteStats, setSiteStats] = useState([]);
  const [totalWorkers, setTotalWorkers] = useState(0);

  // Site Creation State
  const [isSiteModalVisible, setSiteModalVisible] = useState(false);
  const [newSite, setNewSite] = useState({ name: "", location: "", description: "" });
  const [creatingSite, setCreatingSite] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/owners/dashboard");
      if (res.data.success) {
        setSiteStats(res.data.data.siteStats || []);
        setTotalWorkers(res.data.data.summary.totalWorkers || 0);
      }
    } catch {
      Alert.alert("Sync Failed", "Unable to load site data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreateSite = async () => {
    if (!newSite.name || !newSite.location) {
      return Alert.alert("Missing Info", "Site name and location are required.");
    }

    try {
      setCreatingSite(true);
      const res = await API.post("/sites", newSite);
      if (res.data.success) {
        Alert.alert("Success", "New site established successfully!");
        setSiteModalVisible(false);
        setNewSite({ name: "", location: "", description: "" });
        fetchData();
      }
    } catch (e) {
      Alert.alert("Error", e.response?.data?.message || "Failed to create site.");
    } finally {
      setCreatingSite(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Managed Sites</Text>
        {user?.role === "Owner" && (
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => setSiteModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {siteStats.length > 0 ? (
          siteStats.map((site, i) => {
            const pct = totalWorkers > 0 ? (site.workerCount / totalWorkers) * 100 : 0;
            return (
              <TouchableOpacity 
                key={i} 
                style={styles.siteCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate("SiteDetails", { siteId: site._id, siteName: site.name })}
              >
                <View style={styles.siteInfo}>
                  <View>
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.siteMeta}>Location Tracking Active</Text>
                  </View>
                  <View style={styles.siteCountBadge}>
                    <Text style={styles.siteCountText}>{site.workerCount} Workers</Text>
                  </View>
                </View>
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.pctText}>{Math.round(pct)}% of workforce</Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={COLORS.mutedForeground + "40"} />
            <Text style={styles.emptyText}>No active sites found. Create one to start tracking.</Text>
          </View>
        )}
      </ScrollView>

      {/* Site Creation Modal */}
      <Modal
        visible={isSiteModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSiteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Construction Site</Text>
              <TouchableOpacity onPress={() => setSiteModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.mutedForeground} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.inputLabel}>Site Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Skyline Towers"
                placeholderTextColor={COLORS.mutedForeground}
                value={newSite.name}
                onChangeText={(v) => setNewSite({ ...newSite, name: v })}
              />

              <Text style={styles.inputLabel}>Location / City</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Mumbai, Sector 4"
                placeholderTextColor={COLORS.mutedForeground}
                value={newSite.location}
                onChangeText={(v) => setNewSite({ ...newSite, location: v })}
              />

              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 100, textAlignVertical: "top" }]}
                placeholder="Details about the project..."
                placeholderTextColor={COLORS.mutedForeground}
                multiline
                value={newSite.description}
                onChangeText={(v) => setNewSite({ ...newSite, description: v })}
              />

              <TouchableOpacity
                style={[styles.modalSubmitBtn, creatingSite && { opacity: 0.7 }]}
                onPress={handleCreateSite}
                disabled={creatingSite}
              >
                {creatingSite ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.modalSubmitText}>Establish Site</Text>
                    <Ionicons name="business" size={18} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
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
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 24,
    paddingBottom: 16
  },
  pageTitle: { color: COLORS.foreground, fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.primary,
  },
  scroll: { padding: 16, paddingBottom: 100 },
  siteCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  siteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  siteName: { color: COLORS.foreground, fontSize: 18, fontWeight: "800" },
  siteMeta: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2 },
  siteCountBadge: {
    backgroundColor: COLORS.blueLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  siteCountText: { color: COLORS.blue, fontSize: 11, fontWeight: "800" },
  progressContainer: { gap: 10 },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.muted,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  pctText: { color: COLORS.mutedForeground, fontSize: 11, fontWeight: "600", textAlign: "right" },
  emptyState: { padding: 60, alignItems: "center", gap: 20 },
  emptyText: { color: COLORS.mutedForeground, fontSize: 15, textAlign: "center", lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: "900" },
  form: { gap: 16 },
  inputLabel: { color: COLORS.accentForeground, fontSize: 12, fontWeight: "700", marginBottom: -8 },
  modalInput: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    color: COLORS.foreground,
    fontSize: 15,
  },
  modalSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
  },
  modalSubmitText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
