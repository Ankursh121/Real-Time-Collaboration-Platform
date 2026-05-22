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
import { Ionicons } from "@expo/vector-icons";
import API from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { COLORS, RADIUS } from "../theme/colors";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import Loader from "../components/Loader";
import FuturisticButton from "../components/FuturisticButton";
import StatusBadge from "../components/StatusBadge";

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
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Querying Active Workspaces..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Managed Sites</Text>
        {user?.role === "Owner" && (
          <TouchableOpacity 
            style={styles.addBtn}
            onPress={() => setSiteModalVisible(true)}
            activeOpacity={0.8}
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
                activeOpacity={0.8}
                onPress={() => navigation.navigate("SiteDetails", { siteId: site._id, siteName: site.name })}
              >
                <GlassCard level={2} style={styles.siteCard}>
                  <View style={styles.siteInfo}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.siteName}>{site.name}</Text>
                      <Text style={styles.siteMeta}>Location Tracking Active</Text>
                    </View>
                    <StatusBadge color={COLORS.blue} bgColor={COLORS.blueLight}>
                      {site.workerCount} Workers
                    </StatusBadge>
                  </View>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.pctText}>{Math.round(pct)}% of workforce</Text>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color="rgba(255, 255, 255, 0.15)" />
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
                <Ionicons name="close-circle" size={32} color={COLORS.mutedForeground} />
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

              <FuturisticButton
                variant="primary"
                onPress={handleCreateSite}
                loading={creatingSite}
                icon={<Ionicons name="business" size={18} color="#fff" />}
                style={styles.modalSubmitBtn}
              >
                Establish Site
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
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 24,
    paddingBottom: 16,
    paddingTop: Platform.OS === "ios" ? 16 : 24,
  },
  pageTitle: { color: COLORS.foreground, fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  addBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  scroll: { padding: 24, paddingBottom: 110 },
  siteCard: {
    marginBottom: 16,
    padding: 0,
  },
  siteInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  siteName: { color: COLORS.foreground, fontSize: 18, fontWeight: "900", letterSpacing: -0.5 },
  siteMeta: { color: COLORS.mutedForeground, fontSize: 12, marginTop: 2, fontWeight: "500" },
  progressContainer: { gap: 8 },
  progressTrack: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  pctText: { color: COLORS.mutedForeground, fontSize: 11, fontWeight: "700", textAlign: "right" },
  emptyState: { padding: 60, alignItems: "center", gap: 20 },
  emptyText: { color: COLORS.mutedForeground, fontSize: 15, textAlign: "center", lineHeight: 22, fontWeight: "600" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: "#0f0f14",
    borderTopLeftRadius: RADIUS.xxxl,
    borderTopRightRadius: RADIUS.xxxl,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    borderTopWidth: 1.5,
    borderColor: "rgba(124, 111, 247, 0.3)",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  modalTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  form: { gap: 16 },
  inputLabel: { color: COLORS.accentForeground, fontSize: 11, fontWeight: "800", marginBottom: -8, letterSpacing: 1, textTransform: "uppercase" },
  modalInput: {
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    borderRadius: RADIUS.xl,
    padding: 14,
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "600",
  },
  modalSubmitBtn: {
    marginTop: 8,
    width: "100%",
  },
});
