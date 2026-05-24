import crypto from "crypto";
import Subscription from "../models/subscription.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { SubscriptionPlans, SubscriptionStatus } from "../constants/subscription.constants.js";
import razorpay, { getOrCreatePlan, keySecret } from "../services/razorpay.service.js";
import User from "../models/users.models.js";

export const getPlans = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, SubscriptionPlans, "Plans fetched successfully")
  );
});

export const getCurrentSubscription = asyncHandler(async (req, res) => {
  let subscription = await Subscription.findOne({ ownerId: req.user.userId });

  if (!subscription) {
    // Create a free subscription if it doesn't exist
    subscription = await Subscription.create({
      ownerId: req.user.userId,
      plan: "free",
      status: SubscriptionStatus.ACTIVE,
      workerLimit: SubscriptionPlans.FREE.workerLimit,
    });
  }

  // Count active workers
  const workerCount = await User.countDocuments({ 
    ownerId: req.user.userId, 
    role: "Worker", 
    status: "Active" 
  });

  return res.status(200).json(
    new ApiResponse(200, { ...subscription.toObject(), currentWorkerCount: workerCount }, "Current subscription fetched successfully")
  );
});

export const createRazorpaySubscription = asyncHandler(async (req, res) => {
  const { planId } = req.body;
  const plan = Object.values(SubscriptionPlans).find(p => p.id === planId);

  if (!plan || plan.id === "free") {
    throw new ApiError(400, "Invalid plan selected");
  }

  // Check if owner already has a subscription
  let subRecord = await Subscription.findOne({ ownerId: req.user.userId });

  // Resolve real Razorpay Plan ID (Create if doesn't exist)
  let actualPlanId = plan.razorpayPlanId;
  try {
    actualPlanId = await getOrCreatePlan(plan.name, plan.price);
  } catch (err) {
    console.warn("Failed to auto-resolve plan ID, falling back to constant:", err.message);
  }
  
  const options = {
    plan_id: actualPlanId,
    total_count: 60, // 5 years
    quantity: 1,
    customer_notify: 1,
  };

  try {
    const razorSub = await razorpay.subscriptions.create(options);
    
    if (!subRecord) {
      subRecord = new Subscription({ ownerId: req.user.userId });
    }

    subRecord.razorpaySubscriptionId = razorSub.id;
    subRecord.plan = plan.id;
    subRecord.status = SubscriptionStatus.PENDING;
    subRecord.amount = plan.price;
    subRecord.workerLimit = plan.workerLimit;
    
    await subRecord.save();

    return res.status(201).json(
      new ApiResponse(201, razorSub, "Razorpay subscription created")
    );
  } catch (error) {
    console.error("Razorpay Sub Create Error Details:", error);
    throw new ApiError(error.statusCode || 500, error.message || "Razorpay API Error");
  }
});

export const verifySubscription = asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;
  console.log(`Verifying subscription: ${razorpay_subscription_id}, Payment: ${razorpay_payment_id}`);

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(razorpay_payment_id + "|" + razorpay_subscription_id)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const subRecord = await Subscription.findOne({ razorpaySubscriptionId: razorpay_subscription_id });
  if (!subRecord) {
    throw new ApiError(404, "Subscription record not found");
  }

  subRecord.status = SubscriptionStatus.ACTIVE;
  subRecord.paymentHistory.push({
    paymentId: razorpay_payment_id,
    amount: subRecord.amount,
    status: "paid",
    paidAt: new Date(),
  });
  
  await subRecord.save();

  return res.status(200).json(
    new ApiResponse(200, subRecord, "Subscription verified successfully")
  );
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  const subRecord = await Subscription.findOne({ ownerId: req.user.userId });

  if (!subRecord || !subRecord.razorpaySubscriptionId) {
    throw new ApiError(404, "No active paid subscription found");
  }

  try {
    await razorpay.subscriptions.cancel(subRecord.razorpaySubscriptionId);
    
    subRecord.status = SubscriptionStatus.CANCELLED;
    subRecord.cancelledAt = new Date();
    await subRecord.save();

    return res.status(200).json(
      new ApiResponse(200, subRecord, "Subscription cancelled successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Failed to cancel subscription");
  }
});

export const getBillingHistory = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ ownerId: req.user.userId });
  return res.status(200).json(
    new ApiResponse(200, subscription?.paymentHistory || [], "Billing history fetched")
  );
});

export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    throw new ApiError(400, "Coupon code is required");
  }

  if (couponCode.trim().toUpperCase() !== "NIRVESH77") {
    throw new ApiError(400, "Invalid coupon code");
  }

  let subRecord = await Subscription.findOne({ ownerId: req.user.userId });

  const lifetimeDate = new Date();
  lifetimeDate.setFullYear(lifetimeDate.getFullYear() + 100);

  if (!subRecord) {
    subRecord = new Subscription({
      ownerId: req.user.userId,
    });
  }

  subRecord.plan = "advanced";
  subRecord.status = SubscriptionStatus.ACTIVE;
  subRecord.workerLimit = SubscriptionPlans.ADVANCED.workerLimit;
  subRecord.startDate = new Date();
  subRecord.endDate = lifetimeDate;
  subRecord.nextBillingDate = null;
  subRecord.razorpaySubscriptionId = "COUPON_NIRVESH77";
  subRecord.paymentHistory.push({
    paymentId: `COUPON_NIRVESH77_${Date.now()}`,
    amount: 0,
    status: "paid",
    paidAt: new Date(),
  });

  await subRecord.save();

  return res.status(200).json(
    new ApiResponse(200, subRecord, "Coupon applied successfully! Advanced plan activated.")
  );
});
