import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getPlans,
  getCurrentSubscription,
  createRazorpaySubscription,
  verifySubscription,
  cancelSubscription,
  getBillingHistory,
  applyCoupon,
} from "../controllers/subscription.controller.js";
import { handleRazorpayWebhook } from "../controllers/webhook.controller.js";
import { keyId } from "../services/razorpay.service.js";

const router = Router();

// Public webhook route (no JWT)
router.route("/webhook").post(handleRazorpayWebhook);

// Protected routes
router.use(verifyJWT);

router.route("/plans").get(getPlans);
router.route("/current").get(getCurrentSubscription);
router.route("/create").post(createRazorpaySubscription);
router.route("/verify").post(verifySubscription);
router.route("/cancel").post(cancelSubscription);
router.route("/history").get(getBillingHistory);
router.route("/apply-coupon").post(applyCoupon);
router.route("/config/razorpay").get((req, res) => {
  res.status(200).json({ keyId });
});

export default router;
