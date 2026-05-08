import User from "../models/users.models.js";
import Rate from "../models/rate.models.js";
import Attendance from "../models/attendance.models.js";
import Payment from "../models/payment.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";


import mongoose from "mongoose";

export const getPendingWorkers = asyncHandler(async (req, res) => {
  const workers = await User.find({
    ownerId: req.user.userId,
    role: UserRoles.WORKER,
    status: UserStatus.PENDING,
  }).select("-password -OTP");

  return res.status(200).json(
    new ApiResponse(200, workers, "Pending workers fetched successfully")
  );
});

  
export const approveWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: UserRoles.WORKER,
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.status = UserStatus.ACTIVE;
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Worker approved successfully")
  );
});


export const deactivateWorker = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.status = UserStatus.PENDING;
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Worker deactivated successfully")
  );
});


export const assignAdminRole = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: UserRoles.WORKER,
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.role = UserRoles.ADMIN;
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Admin role assigned successfully")
  );
});


export const removeAdminRole = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: UserRoles.ADMIN,
  });

  if (!worker) {
    throw new ApiError(404, "Admin not found");
  }

  worker.role = UserRoles.WORKER;
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Admin role removed successfully")
  );
});

export const updateWorkerProfile = asyncHandler(async (req, res) => {
  const { workerId } = req.params;
  const { workerType, DailyRate, siteId } = req.body;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
  });

  if (!worker) {
    throw new ApiError(404, "User not found");
  }

  if (workerType) worker.workerType = workerType;
  if (DailyRate !== undefined) worker.DailyRate = DailyRate;
  if (siteId !== undefined) worker.siteId = siteId || null;

  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "User profile updated successfully")
  );
});

export const deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findOne({
        _id: userId,
        ownerId: req.user.userId
    });

    if (!user) {
        throw new ApiError(404, "User not found or not owned by you");
    }

    // Unlink from site if any
    await User.findByIdAndDelete(userId);

    // cleanup attendance and payments for this user? 
    // Usually we keep records for legal reasons, but for a simple app we can decide.
    // Let's just delete the user.

    return res.status(200).json(
        new ApiResponse(200, null, "User deleted successfully")
    );
});


export const createRate = asyncHandler(async (req, res) => {
  const { siteId, workerType, dailyRate, overtimeRatePerHour } = req.body;

  if (
    !workerType ||
    dailyRate === undefined ||
    overtimeRatePerHour === undefined
  ) {
    throw new ApiError(400, "Required rate fields missing");
  }

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


export const getActiveRates = asyncHandler(async (req, res) => {
  const rates = await Rate.find({
    ownerId: req.user.userId,
    isActive: true,
  });

  return res.status(200).json(
    new ApiResponse(200, rates, "Active rates fetched successfully")
  );
});


export const getAllWorkers = asyncHandler(async (req, res) => {
  const query = {
    role: { $in: [UserRoles.WORKER, UserRoles.ADMIN] },
  };

  if (req.user.role === UserRoles.OWNER) {
    query.ownerId = req.user.userId;
  } else if (req.user.role === UserRoles.ADMIN) {
    query.ownerId = req.user.ownerId;
    if (req.user.siteId) {
        query.siteId = req.user.siteId;
    } else {
        // If admin has no site, they can't see workers
        return res.status(200).json(new ApiResponse(200, [], "Admin has no assigned site"));
    }
  }

  const workers = await User.find(query).select("-password -OTP");

  return res.status(200).json(
    new ApiResponse(200, workers, "Workers fetched successfully")
  );
});


import Site from "../models/site.models.js";

export const getUniversalDashboard = asyncHandler(async (req, res) => {
  const isOwnerRole = req.user.role === UserRoles.OWNER;
  const ownerId = isOwnerRole ? req.user.userId : req.user.ownerId;
  const adminSiteId = !isOwnerRole ? req.user.siteId : null;

  // 1. Basic Stats
  const workerQuery = { ownerId, role: UserRoles.WORKER, status: UserStatus.ACTIVE };
  const adminQuery = { ownerId, role: UserRoles.ADMIN };
  const siteQuery = { ownerId, isActive: true };
  const attendanceQuery = { ownerId };
  const paymentMatch = { ownerId: new mongoose.Types.ObjectId(ownerId) };

  if (!isOwnerRole && adminSiteId) {
    workerQuery.siteId = adminSiteId;
    siteQuery._id = adminSiteId;
    attendanceQuery.siteId = adminSiteId;
    paymentMatch.siteId = new mongoose.Types.ObjectId(adminSiteId);
  }

  const totalWorkers = await User.countDocuments(workerQuery);
  const totalAdmins = isOwnerRole ? await User.countDocuments(adminQuery) : 0;
  const activeSites = await Site.countDocuments(siteQuery);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  attendanceQuery.date = { $gte: today };
  const attendanceToday = await Attendance.countDocuments(attendanceQuery);

  const totalPayments = await Payment.aggregate([
    { $match: paymentMatch },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$paidAmount" },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  // 2. Weekly Attendance Trend
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const end = new Date(d);
    end.setHours(23, 59, 59, 999);

    const trendQuery = { ownerId, date: { $gte: d, $lte: end } };
    if (!isOwnerRole && adminSiteId) trendQuery.siteId = adminSiteId;

    const count = await Attendance.countDocuments(trendQuery);
    
    last7Days.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.toISOString().split('T')[0],
      count
    });
  }

  // 3. Site-wise Distribution
  const siteMatch = { ownerId, isActive: true };
  if (!isOwnerRole && adminSiteId) siteMatch._id = new mongoose.Types.ObjectId(adminSiteId);

  const siteDistribution = await Site.aggregate([
      { $match: siteMatch },
      {
          $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "siteId",
              as: "workers"
          }
      },
      {
          $project: {
              name: 1,
              workerCount: { $size: "$workers" }
          }
      }
  ]);

  // 4. Recent Activity
  const activityMatch = { ownerId };
  if (!isOwnerRole && adminSiteId) activityMatch.siteId = adminSiteId;

  const recentAttendance = await Attendance.find(activityMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("workerId", "name")
      .populate("siteId", "name");

  const recentPayments = await Payment.find(activityMatch)
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate("workerId", "name");

  const activities = [
      ...recentAttendance.map(a => ({
          type: 'attendance',
          user: a.workerId?.name || "Unknown",
          site: a.siteId?.name || "Multiple Sites",
          time: a.createdAt,
          label: "Marked Present"
      })),
      ...recentPayments.map(p => ({
          type: 'payment',
          user: p.workerId?.name || "Unknown",
          amount: p.paidAmount,
          time: p.updatedAt,
          label: `Received ₹${p.paidAmount.toLocaleString()}`
      }))
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

  const user = await User.findById(req.user.userId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        summary: {
            totalWorkers,
            totalAdmins,
            activeSites,
            attendanceToday,
            totalPaid: totalPayments[0]?.totalPaid || 0,
            totalDue: (totalPayments[0]?.totalAmount || 0) - (totalPayments[0]?.totalPaid || 0),
        },
        weeklyTrend: last7Days,
        siteStats: siteDistribution,
        recentActivity: activities,
        owner: {
            name: user.name,
            inviteCode: user.inviteCode
        }
      },
      "Dashboard analytics fetched successfully"
    )
  );
});
