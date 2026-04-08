import express from "express";
import {
  generatePayment,
  updatePaymentStatus,
} from "../controllers/payment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyJWT, isOwner);

router.post("/generate", generatePayment);
router.patch("/pay/:paymentId", updatePaymentStatus);

export default router;
