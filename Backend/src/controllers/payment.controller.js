import Payment from "../models/payment.models.js";
import Attendance from "../models/attendance.models.js";
import Rate from "../models/rate.models.js";
import User from "../models/users.models.js";
import { calculateWage } from "../utils/wageCalculator.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles } from "../constants/user.constants.js";
import mongoose from "mongoose";


export const generatePayment = asyncHandler(async (req, res) => {
  const { workerId, siteId, periodStart, periodEnd } = req.body;

  if (!workerId || !siteId || !periodStart || !periodEnd) {
    throw new ApiError(400, "Required fields missing");
  }

  const worker = await User.findById(workerId);
  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

 
  if (worker.ownerId.toString() !== req.user.userId.toString()) {
    throw new ApiError(403, "Unauthorized action");
  }

  const attendances = await Attendance.find({
    workerId,
    siteId,
    date: {
      $gte: new Date(periodStart),
      $lte: new Date(periodEnd),
    },
  });

  if (attendances.length === 0) {
    throw new ApiError(400, "No attendance found for this period");
  }

  let totalAmount = 0;

  for (const record of attendances) {
    let rate = await Rate.findOne({
      ownerId: req.user.userId,
      siteId,
      workerType: worker.workerType,
      isActive: true,
    });

    if (!rate) {
      // Fallback to global rate (null site)
      rate = await Rate.findOne({
        ownerId: req.user.userId,
        siteId: null,
        workerType: worker.workerType,
        isActive: true,
      });
    }

    if (!rate) {
      throw new ApiError(400, `Active compensation rate not found for ${worker.workerType} (Site or Global)`);
    }

    const wage = calculateWage({
      hoursWorked: record.hoursWorked,
      overtimeHours: record.overtimeHours,
      dailyRate: rate.dailyRate,
      overtimeRatePerHour: rate.overtimeRatePerHour,
    });

    totalAmount += wage.totalWage;
  }

  const payment = await Payment.create({
    ownerId: req.user.userId,
    workerId,
    siteId,
    periodStart,
    periodEnd,
    totalAmount,
    paidAmount: 0,
    status: "Pending",
  });

  res.status(201).json(
    new ApiResponse(201, payment, "Payment generated successfully")
  );
});

export const getAllPayments = asyncHandler(async (req, res) => {
  const query = {};

  if (req.user.role === UserRoles.OWNER) {
    query.ownerId = req.user.userId;
  } else if (req.user.role === UserRoles.ADMIN) {
    query.ownerId = req.user.ownerId;
    if (req.user.siteId) {
      query.siteId = req.user.siteId;
    } else {
        return res.status(200).json(new ApiResponse(200, [], "Admin has no site assigned"));
    }
  }

  const payments = await Payment.find(query)
    .populate("workerId", "name phone workerType photo")
    .populate("siteId", "name location")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, payments, "Payments fetched successfully")
  );
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { paidAmount } = req.body;

  if (!paymentId) {
    throw new ApiError(400, "Payment ID is required");
  }

  const payment = await Payment.findById(paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }


  if (payment.ownerId.toString() !== req.user.userId.toString()) {
    throw new ApiError(403, "Unauthorized action");
  }

  if (paidAmount == null || paidAmount < 0) {
    throw new ApiError(400, "Invalid paid amount");
  }


  payment.paidAmount = paidAmount;

  if (paidAmount === 0) {
    payment.status = "Pending";
  } else if (paidAmount < payment.totalAmount) {
    payment.status = "Partial";
  } else if (paidAmount >= payment.totalAmount) {
    payment.status = "Paid";
  }

  await payment.save();

  res.status(200).json(
    new ApiResponse(200, payment, "Payment status updated successfully")
  );
});

export const getWorkerPaymentSummary = asyncHandler(async (req, res) => {
  const ownerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;
  
  // 1. Get all workers and their current rates (approximate for live summary)
  const workers = await User.find({ 
      ownerId, 
      role: UserRoles.WORKER 
  }).select("name phone workerType siteId");

  // 2. Get all rates for this owner to calculate live dues
  const allRates = await Rate.find({ ownerId, isActive: true });

  // 3. Aggregate payments (Actual Money Disbursed)
  const paymentStats = await Payment.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      { $group: {
          _id: "$workerId",
          totalPaid: { $sum: "$paidAmount" },
          lastPaymentDate: { $max: "$updatedAt" }
      }}
  ]);

  // 4. Aggregate Attendance to calculate potential earnings
  const attendanceStats = await Attendance.aggregate([
      { $match: { ownerId: new mongoose.Types.ObjectId(ownerId) } },
      { $group: {
          _id: { workerId: "$workerId", siteId: "$siteId" },
          hours: { $sum: "$hoursWorked" },
          overtime: { $sum: "$overtimeHours" }
      }}
  ]);

  // 5. Merge data to calculate Live Dues
  const summary = workers.map(worker => {
      // Find payments for this worker
      const pStats = paymentStats.find(s => s._id.toString() === worker._id.toString());
      
      // Calculate earnings from attendance across all sites
      const wAttendance = attendanceStats.filter(a => a._id.workerId.toString() === worker._id.toString());
      
      let totalEarned = 0;
      wAttendance.forEach(a => {
          // Find rate for this worker category on this site, or global fallback
          let rate = allRates.find(r => 
              r.workerType === worker.workerType && 
              r.siteId?.toString() === a._id.siteId?.toString()
          );

          if (!rate) {
              rate = allRates.find(r => r.workerType === worker.workerType && !r.siteId);
          }

          if (rate) {
              // Simple wage calc for summary: (hours / 8) * dailyRate + overtime * otRate
              // Match wageCalculator.js logic roughly
              const standardHours = 8;
              const baseWage = a.hours >= standardHours ? rate.dailyRate : (rate.dailyRate / standardHours) * a.hours;
              const otWage = a.overtime * rate.overtimeRatePerHour;
              totalEarned += (baseWage + otWage);
          }
      });

      return {
          _id: worker._id,
          name: worker.name,
          phone: worker.phone,
          workerType: worker.workerType,
          siteId: worker.siteId,
          totalEarned: Math.round(totalEarned),
          totalPaid: pStats?.totalPaid || 0,
          dueAmount: Math.round(totalEarned - (pStats?.totalPaid || 0)),
          lastActivity: pStats?.lastPaymentDate || null
      };
  });

  return res.status(200).json(
      new ApiResponse(200, summary, "Worker payment summary fetched successfully")
  );
});

export const recordManualPayment = asyncHandler(async (req, res) => {
    const { workerId, amount, remark } = req.body;
    const ownerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;

    if (!workerId || !amount || amount <= 0) {
        throw new ApiError(400, "Worker ID and positive amount are required");
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.ownerId.toString() !== ownerId.toString()) {
        throw new ApiError(404, "Worker not found or unauthorized");
    }

    // Create a special manual payment record
    // We set period to current date if not specified
    const payment = await Payment.create({
        ownerId,
        workerId,
        siteId: worker.siteId || null,
        periodStart: new Date(),
        periodEnd: new Date(),
        totalAmount: 0,
        paidAmount: amount,
        status: "Paid",
        remark: remark || "Manual Settlement",
        paymentDate: new Date(),
        isApproved: true,
        approvedBy: req.user.userId
    });

    return res.status(201).json(
        new ApiResponse(201, payment, "Manual payment recorded successfully")
    );
});

