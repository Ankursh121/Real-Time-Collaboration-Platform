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

import { upload } from "../middlewares/Multer.middleware.js";

import { checkWorkerLimit } from "../middlewares/subscription.middleware.js";

const router = express.Router();


router.post(
  "/register",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "aadhar", maxCount: 1 },
  ]),
  checkWorkerLimit,
  registerWorker
);


router.get("/me", verifyJWT, isWorker, getMyProfile);
router.get("/attendance", verifyJWT, isWorker, getMyAttendance);
router.get("/payments", verifyJWT, isWorker, getMyPayments);
router.get("/summary", verifyJWT, isWorker, getMyEarningSummary);

export default router;
