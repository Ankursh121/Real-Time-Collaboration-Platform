import express from "express";
import {
  sendOTP,
  logoutUser,
  getCurrentUser,
  verifyOTP,
  updateProfilePhoto,
} from "../controllers/auth.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/Multer.middleware.js";

const router = express.Router();

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getCurrentUser);
router.patch("/photo", verifyJWT, upload.single("photo"), updateProfilePhoto);

export default router;
