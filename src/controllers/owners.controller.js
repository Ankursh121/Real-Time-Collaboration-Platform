import User from "../models/users.models.js";
import Rate from "../models/rate.models.js";
import Attendance from "../models/attendance.models.js";
import Payment from "../models/payment.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * ==========================================================
 * 1️⃣ GET ALL PENDING WORKERS
 * ==========================================================
 * @route   GET /api/owners/pending-workers
 * @access  OWNER
 */

export const getPendingWorkers = asyncHandler(async (req, res) => {
  const workers = await User.find({
    ownerId: req.user.userId,
    role: "WORKER",
    status: "PENDING",
  }).select("-password -OTP");

  return res.status(200).json(
    new ApiResponse(200, workers, "Pending workers fetched successfully")
  );
});

/**
 * ==========================================================
 * 2️⃣ APPROVE WORKER
 * ==========================================================
 * @route   PATCH /api/owners/approve/:workerId
 * @access  OWNER
 */
export const approveWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: "WORKER",
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.status = "ACTIVE";
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Worker approved successfully")
  );
});

/**
 * ==========================================================
 * 3️⃣ DEACTIVATE WORKER
 * ==========================================================
 * @route   PATCH /api/owners/deactivate/:workerId
 * @access  OWNER
 */
export const deactivateWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.status = "PENDING";
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Worker deactivated successfully")
  );
});

/**
 * ==========================================================
 * 4️⃣ ASSIGN ADMIN ROLE
 * ==========================================================
 * @route   PATCH /api/owners/assign-admin/:workerId
 * @access  OWNER
 */
export const assignAdminRole = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: "WORKER",
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.role = "ADMIN";
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Admin role assigned successfully")
  );
});

/**
 * ==========================================================
 * 5️⃣ REMOVE ADMIN ROLE
 * ==========================================================
 * @route   PATCH /api/owners/remove-admin/:workerId
 * @access  OWNER
 */
export const removeAdminRole = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: "ADMIN",
  });

  if (!worker) {
    throw new ApiError(404, "Admin not found");
  }

  worker.role = "WORKER";
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Admin role removed successfully")
  );
});

/**
 * ==========================================================
 * 6️⃣ CREATE OR UPDATE RATE
 * ==========================================================
 * @route   POST /api/owners/rates
 * @access  OWNER
 */
export const createRate = asyncHandler(async (req, res) => {
  const { siteId, workerType, dailyRate, overtimeRatePerHour } = req.body;

  if (
    !workerType ||
    dailyRate === undefined ||
    overtimeRatePerHour === undefined
  ) {
    throw new ApiError(400, "Required rate fields missing");
  }

  // Deactivate previous active rate
  await Rate.updateMany(
    {
      ownerId: req.user.userId,
      siteId: siteId || null,
      workerType,
      isActive: true,
    },
    { isActive: false }
  );

  const rate = await Rate.create({
    ownerId: req.user.userId,
    siteId: siteId || null,
    workerType,
    dailyRate,
    overtimeRatePerHour,
    effectiveFrom: new Date(),
    isActive: true,
  });

  return res.status(201).json(
    new ApiResponse(201, rate, "Rate created successfully")
  );
});

/**
 * ==========================================================
 * 7️⃣ GET ACTIVE RATES
 * ==========================================================
 * @route   GET /api/owners/rates
 * @access  OWNER
 */
export const getActiveRates = asyncHandler(async (req, res) => {
  const rates = await Rate.find({
    ownerId: req.user.userId,
    isActive: true,
  });

  return res.status(200).json(
    new ApiResponse(200, rates, "Active rates fetched successfully")
  );
});

/**
 * ==========================================================
 * 8️⃣ GET ALL WORKERS (ACTIVE)
 * ==========================================================
 * @route   GET /api/owners/workers
 * @access  OWNER
 */
export const getAllWorkers = asyncHandler(async (req, res) => {
  const workers = await User.find({
    ownerId: req.user.userId,
    role: { $in: ["WORKER", "ADMIN"] },
  }).select("-password -OTP");

  return res.status(200).json(
    new ApiResponse(200, workers, "Workers fetched successfully")
  );
});

/**
 * ==========================================================
 * 9️⃣ OWNER DASHBOARD SUMMARY
 * ==========================================================
 * @route   GET /api/owners/dashboard
 * @access  OWNER
 */
export const getOwnerDashboard = asyncHandler(async (req, res) => {
  const totalWorkers = await User.countDocuments({
    ownerId: req.user.userId,
    role: "WORKER",
    status: "ACTIVE",
  });

  const totalAdmins = await User.countDocuments({
    ownerId: req.user.userId,
    role: "ADMIN",
  });

  const totalAttendance = await Attendance.countDocuments({
    ownerId: req.user.userId,
  });

  const totalPayments = await Payment.aggregate([
    { $match: { ownerId: req.user.userId } },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$paidAmount" },
        totalGenerated: { $sum: "$totalAmount" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalWorkers,
        totalAdmins,
        totalAttendance,
        totalPaid: totalPayments[0]?.totalPaid || 0,
        totalGenerated: totalPayments[0]?.totalGenerated || 0,
      },
      "Owner dashboard data fetched successfully"
    )
  );
});
