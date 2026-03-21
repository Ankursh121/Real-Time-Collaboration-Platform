import User from "../models/users.models.js";
import Attendance from "../models/attendance.models.js";
import Payment from "../models/payment.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import  ApiError  from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";

/**
 * ==========================================================
 * 1️⃣ REGISTER WORKER (Self Registration)
 * ==========================================================
 * @route   POST /api/workers/register
 * @access  Public
 */

export const registerWorker = asyncHandler(async (req, res) => {
  const { name, phone, gender, workerType, password, inviteCode } = req.body;

  if (
    [name, phone, gender, workerType, password, inviteCode].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ApiError(409, "User with this phone already exists");
  }

  // 🔹 Find owner using invite code
  const owner = await User.findOne({
    inviteCode,
    role: "OWNER",
  });

  if (!owner) {
    throw new ApiError(400, "Invalid contractor invite code");
  }

  // 🔹 Upload photo (mandatory)
  const photoLocalPath = req.files?.photo?.[0]?.path;
  if (!photoLocalPath) {
    throw new ApiError(400, "Worker photo is required");
  }

  const photoUpload = await uploadOnCloudinary(photoLocalPath);
  if (!photoUpload) {
    throw new ApiError(500, "Photo upload failed");
  }

  // 🔹 Upload Aadhaar (optional)
  let aadharUpload = null;
  if (req.files?.aadhar?.[0]?.path) {
    aadharUpload = await uploadOnCloudinary(req.files.aadhar[0].path);
  }

  // 🔹 Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔹 Create worker (PENDING by default)
  const worker = await User.create({
    name,
    phone,
    gender,
    workerType,
    password: hashedPassword,
    photo: photoUpload.url,
    aadhar: aadharUpload?.url || "",
    role: "WORKER",
    status: "PENDING",
    ownerId: owner._id,
  });

  const createdWorker = await User.findById(worker._id).select(
    "-password -OTP"
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      createdWorker,
      "Worker registered successfully. Waiting for owner approval."
    )
  );
});

/**
 * ==========================================================
 * 2️⃣ GET LOGGED-IN WORKER PROFILE
 * ==========================================================
 * @route   GET /api/workers/me
 * @access  WORKER (Protected)
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const worker = await User.findById(req.user.userId).select(
    "-password -OTP"
  );

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  return res.status(200).json(
    new ApiResponse(200, worker, "Profile fetched successfully")
  );
});

/**
 * ==========================================================
 * 3️⃣ GET MY ATTENDANCE RECORDS
 * ==========================================================
 * @route   GET /api/workers/attendance
 * @access  WORKER (Protected)
 */
export const getMyAttendance = asyncHandler(async (req, res) => {
  const attendance = await Attendance.find({
    workerId: req.user.userId,
  })
    .sort({ date: -1 })
    .populate("siteId", "name location");

  return res.status(200).json(
    new ApiResponse(
      200,
      attendance,
      "Attendance records fetched successfully"
    )
  );
});

/**
 * ==========================================================
 * 4️⃣ GET MY PAYMENT HISTORY
 * ==========================================================
 * @route   GET /api/workers/payments
 * @access  WORKER (Protected)
 */
export const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    workerId: req.user.userId,
  })
    .sort({ periodStart: -1 })
    .populate("siteId", "name location");

  return res.status(200).json(
    new ApiResponse(
      200,
      payments,
      "Payment history fetched successfully"
    )
  );
});

/**
 * ==========================================================
 * 5️⃣ GET WORKER EARNING SUMMARY (Optional but Powerful)
 * ==========================================================
 * @route   GET /api/workers/summary
 * @access  WORKER (Protected)
 */
export const getMyEarningSummary = asyncHandler(async (req, res) => {
  const payments = await Payment.find({
    workerId: req.user.userId,
  });

  let totalEarned = 0;
  let totalPaid = 0;

  payments.forEach((payment) => {
    totalEarned += payment.totalAmount;
    totalPaid += payment.paidAmount;
  });

  const pendingAmount = totalEarned - totalPaid;

  return res.status(200).json(
    new ApiResponse(200, {
      totalEarned,
      totalPaid,
      pendingAmount,
    }, "Earning summary fetched successfully")
  );
});
