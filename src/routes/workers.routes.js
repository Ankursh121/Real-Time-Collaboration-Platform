import express from "express";
import {
  registerWorker,
  getMyProfile,
  getMyAttendance,
  getMyPayments,
  getMyEarningSummary,
} from "../controllers/workers.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isWorker } from "../middlewares/role.middleware.js";

const router = express.Router();

// Public
router.post("/register", registerWorker);

// Worker protected
router.get("/me", verifyJWT, isWorker, getMyProfile);
router.get("/attendance", verifyJWT, isWorker, getMyAttendance);
router.get("/payments", verifyJWT, isWorker, getMyPayments);
router.get("/summary", verifyJWT, isWorker, getMyEarningSummary);

export default router;
