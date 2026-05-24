import express from "express";
import {
  markAttendance,
  getWorkerAttendanceHistory,
} from "../controllers/attendance.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdminOrOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/mark", verifyJWT, isAdminOrOwner, markAttendance);
router.get("/history/:workerId", verifyJWT, isAdminOrOwner, getWorkerAttendanceHistory);

export default router;
