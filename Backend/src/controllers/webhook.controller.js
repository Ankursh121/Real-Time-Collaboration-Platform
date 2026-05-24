import crypto from "crypto";
import Subscription from "../models/subscription.models.js";
import { SubscriptionStatus } from "../constants/subscription.constants.js";
import { webhookSecret } from "../services/razorpay.service.js";

export const handleRazorpayWebhook = async (req, res) => {
  const secret = webhookSecret;
  const signature = req.headers["x-razorpay-signature"];

  // Use rawBody buffer if available to ensure exact byte match, else fallback to stringified body
  const rawBodyData = req.rawBody ? req.rawBody : JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBodyData)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;
  const payload = req.body.payload;

  console.log(`Razorpay Webhook Event: ${event}`);

  try {
    switch (event) {
      case "subscription.activated":
      case "subscription.charged": {
        const razorSub = payload.subscription.entity;
        const subRecord = await Subscription.findOne({ razorpaySubscriptionId: razorSub.id });
        if (subRecord) {
          subRecord.status = SubscriptionStatus.ACTIVE;
          subRecord.startDate = new Date(razorSub.start_at * 1000);
          subRecord.endDate = new Date(razorSub.end_at * 1000);
          subRecord.nextBillingDate = new Date(razorSub.charge_at * 1000);
          
          if (event === "subscription.charged") {
            const payment = payload.payment.entity;
            subRecord.paymentHistory.push({
              paymentId: payment.id,
              amount: payment.amount / 100,
              status: "paid",
              paidAt: new Date(),
            });
          }
          await subRecord.save();
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.expired": {
        const razorSub = payload.subscription.entity;
        const subRecord = await Subscription.findOne({ razorpaySubscriptionId: razorSub.id });
        if (subRecord) {
          subRecord.status = event === "subscription.cancelled" ? SubscriptionStatus.CANCELLED : SubscriptionStatus.EXPIRED;
          await subRecord.save();
        }
        break;
      }

      case "subscription.halted": {
        const razorSub = payload.subscription.entity;
        const subRecord = await Subscription.findOne({ razorpaySubscriptionId: razorSub.id });
        if (subRecord) {
          subRecord.status = SubscriptionStatus.EXPIRED;
          await subRecord.save();
        }
        break;
      }

      case "payment.captured": {
        // Handle standalone payments if any
        break;
      }
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).send("Webhook processing failed");
  }
};
