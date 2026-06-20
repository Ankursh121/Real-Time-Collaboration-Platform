import express from "express";
import {
  generatePayment,
  updatePaymentStatus,
  getAllPayments,
  getWorkerPaymentSummary,
  recordManualPayment
} from "../controllers/payment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner, isAdminOrOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/generate", verifyJWT, isAdminOrOwner, generatePayment);
router.patch("/pay/:paymentId", verifyJWT, isAdminOrOwner, updatePaymentStatus);
router.post("/direct-pay", verifyJWT, isAdminOrOwner, recordManualPayment);
router.get("/", verifyJWT, isAdminOrOwner, getAllPayments);
router.get("/summary", verifyJWT, isAdminOrOwner, getWorkerPaymentSummary);

export default router;
