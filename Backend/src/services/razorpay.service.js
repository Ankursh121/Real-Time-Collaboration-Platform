import Razorpay from "razorpay";
import crypto from "crypto";
import "dotenv/config";

export const keyId = (process.env.RAZORPAY_KEY_ID || "").trim();
export const keySecret = (process.env.RAZORPAY_KEY_SECRET || "").trim();
export const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

console.log(`Razorpay Init: ID=${keyId.substring(0, 8)}... (len:${keyId.length}), Secret=${keySecret.substring(0, 2)}... (len:${keySecret.length})`);

export const createSubscription = async (planId, customerId) => {
  return await razorpay.subscriptions.create({
    plan_id: planId,
    customer_id: customerId,
    total_count: 120, // 10 years for monthly
    quantity: 1,
  });
};

export const getOrCreatePlan = async (planName, amount, interval = "monthly") => {
    // List plans to see if one matches
    const plans = await razorpay.plans.all();
    const existingPlan = plans.items.find(p => p.item.name === planName && p.item.amount === amount * 100);
    
    if (existingPlan) return existingPlan.id;

    // Create new plan if not found
    const newPlan = await razorpay.plans.create({
        period: interval,
        interval: 1,
        item: {
            name: planName,
            amount: amount * 100, // paise
            currency: "INR",
        }
    });
    return newPlan.id;
};

export const cancelSubscription = async (subscriptionId) => {
  return await razorpay.subscriptions.cancel(subscriptionId);
};

export const verifyWebhookSignature = (body, signature) => {
  const bodyData = Buffer.isBuffer(body) || typeof body === "string" ? body : JSON.stringify(body);
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(bodyData)
    .digest("hex");
  return expectedSignature === signature;
};

export default razorpay;
