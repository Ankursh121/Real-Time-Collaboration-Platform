import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
  TextInput,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";
import API from "../services/api";
import { COLORS, RADIUS } from "../theme/colors";
import { useAuth } from "../contexts/AuthContext";
import ScreenWrapper from "../components/ScreenWrapper";
import GlassCard from "../components/GlassCard";
import FuturisticButton from "../components/FuturisticButton";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";

const { width } = Dimensions.get("window");

const PlanCard = ({ plan, onSelect, currentPlan, isPopular }) => {
  const isCurrent = currentPlan === plan.id;

  return (
    <Animated.View 
      entering={FadeInUp.delay(200)}
    >
      <GlassCard 
        level={2} 
        style={[
          styles.planCard, 
          isPopular && styles.popularCard,
          isCurrent && styles.currentPlanCard
        ]}
      >
        {isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
          </View>
        )}
        <Text style={styles.planName}>{plan.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>₹</Text>
          <Text style={styles.price}>{plan.price}</Text>
          <Text style={styles.duration}>/month</Text>
        </View>

        <View style={styles.featureList}>
          <Feature item={`${plan.workerLimit === 1000000 ? 'Unlimited' : plan.workerLimit} Workers`} />
          <Feature item="Priority Support" />
          <Feature item="Advanced Analytics" />
          {plan.id === 'advanced' && <Feature item="All Premium Features" />}
        </View>

        <FuturisticButton
          variant={isCurrent ? "glass" : "primary"}
          onPress={() => onSelect(plan)}
          disabled={isCurrent}
          style={styles.planBtn}
        >
          {isCurrent ? "Current Plan" : "Upgrade Now"}
        </FuturisticButton>
      </GlassCard>
    </Animated.View>
  );
};

const Feature = ({ item }) => (
  <View style={styles.featureRow}>
    <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
    <Text style={styles.featureText}>{item}</Text>
  </View>
);

export default function SubscriptionScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState({});
  const [subscription, setSubscription] = useState(null);
  const [history, setHistory] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, subRes, historyRes] = await Promise.all([
        API.get("/subscription/plans"),
        API.get("/subscription/current"),
        API.get("/subscription/history"),
      ]);

      if (plansRes.data.success) setPlans(plansRes.data.data);
      if (subRes.data.success) setSubscription(subRes.data.data);
      if (historyRes.data.success) setHistory(historyRes.data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSelectPlan = async (plan) => {
    if (plan.id === 'free') return;

    try {
      setLoading(true);
      const res = await API.post("/subscription/create", { planId: plan.id });
      
      if (res.data.success) {
        const razorSub = res.data.data;
        
        if (Platform.OS === "web") {
          const resScript = await loadRazorpayScript();
          if (!resScript || !window.Razorpay) {
            Alert.alert("Configuration Error", "Razorpay SDK could not be loaded. Please check your internet connection.");
            setLoading(false);
            return;
          }

          try {
            const configRes = await API.get("/subscription/config/razorpay");
            const options = {
              key: configRes.data.keyId,
              subscription_id: razorSub.id,
              name: "Worksite Pro",
              description: `${plan.name} Subscription`,
              handler: function (response) {
                verifyPayment(response);
              },
              modal: {
                ondismiss: function() {
                  setLoading(false);
                }
              },
              prefill: {
                name: user?.name,
                contact: user?.phone,
              },
              theme: { color: COLORS.primary },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response){
                Alert.alert("Payment Failed", response.error.description);
                setLoading(false);
            });
            
            rzp.open();
            setLoading(false);
          } catch (err) {
            console.error("Razorpay Open Error:", err);
            Alert.alert("Checkout Error", "Could not open Razorpay checkout. Please disable popup blockers.");
            setLoading(false);
          }
        } else {
          if (razorSub && razorSub.short_url) {
            Linking.openURL(razorSub.short_url).catch((err) => {
              Alert.alert("Error", "Could not open the payment page in your browser.");
            });
            Alert.alert(
              "Redirecting to Payment",
              "Opening Razorpay's secure checkout page in your web browser. Once payment is completed, return to this screen to verify your plan.",
              [{ text: "OK" }]
            );
          } else {
            Alert.alert("Checkout Redirect", "Please log in to the Worksite Pro Web dashboard to purchase/upgrade subscriptions securely.");
          }
          setLoading(false);
        }
      }
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const verifyPayment = async (data) => {
    try {
      setLoading(true);
      const res = await API.post("/subscription/verify", data);
      if (res.data.success) {
        Alert.alert("Success", "Subscription activated successfully!");
        fetchData();
      }
    } catch (error) {
      Alert.alert("Payment Failed", "Could not verify your payment");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      Alert.alert("Error", "Please enter a coupon code");
      return;
    }

    try {
      setCouponLoading(true);
      const res = await API.post("/subscription/apply-coupon", {
        couponCode: couponCode.trim(),
      });

      if (res.data.success) {
        Alert.alert("Success", "Coupon applied successfully! Advanced plan activated.");
        setCouponCode("");
        fetchData();
      }
    } catch (error) {
      Alert.alert(
        "Invalid Coupon",
        error.response?.data?.message || "Failed to apply coupon. Please try again."
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel? You will lose premium benefits at the end of the billing cycle.",
      [
        { text: "Keep Plan", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true);
              const res = await API.post("/subscription/cancel");
              if (res.data.success) {
                Alert.alert("Cancelled", "Your subscription has been cancelled.");
                fetchData();
              }
            } catch (e) {
              Alert.alert("Error", "Failed to cancel subscription");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading && !subscription) {
    return (
      <ScreenWrapper style={styles.loaderContainer}>
        <Loader message="Synchronizing Accounts..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Current Plan Summary */}
        <Animated.View entering={FadeInDown}>
          <GlassCard level={2} style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryLabel}>CURRENT PLAN</Text>
                <Text style={styles.summaryValue}>{subscription?.plan?.toUpperCase() || "FREE"}</Text>
              </View>
              <StatusBadge 
                color={subscription?.status === 'active' ? COLORS.green : COLORS.orange} 
                bgColor={subscription?.status === 'active' ? COLORS.greenLight : COLORS.orangeLight}
              >
                {subscription?.status?.toUpperCase() || "ACTIVE"}
              </StatusBadge>
            </View>

            <View style={styles.usageContainer}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageLabel}>Worker Usage</Text>
                <Text style={styles.usageValue}>
                  {subscription?.currentWorkerCount || 0} / {subscription?.workerLimit || 10}
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min(100, ((subscription?.currentWorkerCount || 0) / (subscription?.workerLimit || 10)) * 100)}%` }
                  ]} 
                />
              </View>
            </View>

            {subscription?.nextBillingDate && (
              <View style={styles.billingNote}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.mutedForeground} />
                <Text style={styles.billingNoteText}>
                  Next billing on {new Date(subscription.nextBillingDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {subscription?.plan !== 'free' && (
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        </Animated.View>

        <Text style={styles.sectionTitle}>Available Plans</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plansScroll}>
          {Object.values(plans).map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onSelect={handleSelectPlan} 
              currentPlan={subscription?.plan}
              isPopular={plan.id === 'pro'}
            />
          ))}
        </ScrollView>

        {/* Coupon Code Section */}
        <Text style={styles.sectionTitle}>Promo Coupon</Text>
        <Animated.View entering={FadeInDown.delay(100)}>
          <GlassCard level={2} style={styles.couponCard}>
            <View style={styles.couponHeader}>
              <MaterialCommunityIcons name="ticket-percent" size={24} color={COLORS.primary} />
              <Text style={styles.couponCardTitle}>Apply Coupon Code</Text>
            </View>
            <Text style={styles.couponSubtitle}>
              Unlock premium features or lifetime subscriptions with a coupon code.
            </Text>
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
                placeholderTextColor={COLORS.mutedForeground}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                editable={!couponLoading}
              />
              <FuturisticButton
                variant="primary"
                onPress={handleApplyCoupon}
                loading={couponLoading}
                style={styles.couponBtn}
              >
                Apply
              </FuturisticButton>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Billing History */}
        <Text style={styles.sectionTitle}>Billing History</Text>
        <GlassCard level={2} style={styles.historyCard}>
          {history.length > 0 ? (
            history.map((item, index) => (
              <View key={index} style={[styles.historyItem, index === history.length - 1 && { borderBottomWidth: 0 }]}>
                <View>
                  <Text style={styles.historyId}>Payment ID: {item.paymentId}</Text>
                  <Text style={styles.historyDate}>{new Date(item.paidAt).toLocaleDateString()}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>₹{item.amount}</Text>
                  <StatusBadge color={COLORS.green} bgColor={COLORS.greenLight} style={{ marginTop: 4 }}>
                    PAID
                  </StatusBadge>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No payment history found.</Text>
            </View>
          )}
        </GlassCard>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 12,
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
  headerTitle: { fontSize: 20, fontWeight: "900", color: COLORS.foreground, letterSpacing: -0.5 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 110 },
  summaryCard: {
    padding: 0,
  },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 25 },
  summaryLabel: { fontSize: 10, fontWeight: "800", color: COLORS.mutedForeground, letterSpacing: 1 },
  summaryValue: { fontSize: 24, fontWeight: "900", color: COLORS.primary, marginTop: 4 },
  usageContainer: { marginBottom: 20 },
  usageHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  usageLabel: { fontSize: 14, fontWeight: "800", color: COLORS.foreground },
  usageValue: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  progressBar: { height: 8, backgroundColor: "rgba(255, 255, 255, 0.08)", borderRadius: RADIUS.full, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: RADIUS.full },
  billingNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 5 },
  billingNoteText: { fontSize: 12, color: COLORS.mutedForeground, fontWeight: "600" },
  cancelBtn: { marginTop: 20, alignSelf: "flex-start" },
  cancelBtnText: { color: COLORS.orange, fontSize: 13, fontWeight: "800" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.foreground, marginTop: 30, marginBottom: 15 },
  plansScroll: { paddingRight: 20, paddingVertical: 4 },
  planCard: {
    width: width * 0.76,
    marginRight: 16,
    padding: 0,
  },
  popularCard: { borderColor: COLORS.primary, borderWidth: 1.5 },
  currentPlanCard: { opacity: 0.8 },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  popularBadgeText: { color: "#fff", fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  planName: { fontSize: 20, fontWeight: "900", color: COLORS.foreground, letterSpacing: -0.5 },
  priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 15, marginBottom: 20 },
  currency: { fontSize: 18, fontWeight: "800", color: COLORS.foreground },
  price: { fontSize: 36, fontWeight: "900", color: COLORS.foreground, marginHorizontal: 2 },
  duration: { fontSize: 14, color: COLORS.mutedForeground, fontWeight: "700" },
  featureList: { gap: 12, marginBottom: 25 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 14, color: COLORS.mutedForeground, fontWeight: "700" },
  planBtn: { width: "100%" },
  historyCard: {
    padding: 0,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  historyId: { fontSize: 13, fontWeight: "800", color: COLORS.foreground },
  historyDate: { fontSize: 11, color: COLORS.mutedForeground, marginTop: 2, fontWeight: "600" },
  historyRight: { alignItems: "flex-end" },
  historyAmount: { fontSize: 16, fontWeight: "900", color: COLORS.foreground },
  emptyHistory: { padding: 20, alignItems: "center" },
  emptyHistoryText: { color: COLORS.mutedForeground, fontSize: 14, fontWeight: "600" },
  couponCard: {
    padding: 0,
  },
  couponHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  couponCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.foreground,
  },
  couponSubtitle: {
    fontSize: 13,
    color: COLORS.mutedForeground,
    marginBottom: 16,
    lineHeight: 18,
  },
  couponInputContainer: {
    flexDirection: "row",
    gap: 12,
  },
  couponInput: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 36, 0.6)",
    borderWidth: 1.5,
    borderColor: "rgba(42, 42, 56, 1)",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    color: COLORS.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  couponBtn: {
    minWidth: 80,
  },
});
