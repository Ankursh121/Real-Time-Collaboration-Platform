import express from "express";
import {
  markAttendance,
} from "../controllers/attendance.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isAdminOrOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

// Admin or Owner can mark attendance
router.post("/mark", verifyJWT, isAdminOrOwner, markAttendance);

export default router;
