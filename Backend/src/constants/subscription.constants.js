export const SubscriptionPlans = {
  FREE: {
    id: "free",
    name: "Free Plan",
    price: 0,
    workerLimit: 10,
    razorpayPlanId: null,
  },
  BASIC: {
    id: "basic",
    name: "Basic Plan",
    price: 299,
    workerLimit: 30,
    razorpayPlanId: "plan_O9wE2k8P6z1v2w", // Example ID, replace with actual if needed or let Razorpay handle it
  },
  PRO: {
    id: "pro",
    name: "Pro Plan",
    price: 999,
    workerLimit: 100,
    razorpayPlanId: "plan_O9wF3l9Q7a2x3x", // Example ID
  },
  ADVANCED: {
    id: "advanced",
    name: "Advanced Plan",
    price: 1999,
    workerLimit: 1000000, // Unlimited
    razorpayPlanId: "plan_O9wG4m0R8b3y4y", // Example ID
  },
};

export const SubscriptionStatus = {
  TRIAL: "trial",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
  PENDING: "pending",
};
