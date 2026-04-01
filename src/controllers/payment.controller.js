import Payment from "../models/payment.models.js";
import Attendance from "../models/attendance.models.js";
import Rate from "../models/rate.models.js";
import User from "../models/users.models.js";
import { calculateWage } from "../utils/wageCalculator.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";


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
    const rate = await Rate.findOne({
      ownerId: req.user.userId,
      siteId,
      workerType: worker.workerType,
      isActive: true,
    });

    if (!rate) {
      throw new ApiError(400, "Active rate not found");
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
    status: "PENDING",
  });

  res.status(201).json({
    success: true,
    message: "Payment generated successfully",
    data: payment,
  });
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
    payment.status = "PENDING";
  } else if (paidAmount < payment.totalAmount) {
    payment.status = "PARTIAL";
  } else if (paidAmount >= payment.totalAmount) {
    payment.status = "PAID";
  }

  await payment.save();

  res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    data: payment,
  });
});