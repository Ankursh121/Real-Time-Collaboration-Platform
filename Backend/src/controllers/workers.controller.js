import User from "../models/users.models.js";
import Attendance from "../models/attendance.models.js";
import Payment from "../models/payment.models.js";
import Rate from "../models/rate.models.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import bcrypt from "bcrypt";


export const registerWorker = asyncHandler(async (req, res) => {
  const { name, phone, gender, workerType, password, inviteCode } = req.body || {}; // Ensure safe destructuring

  // Validate required fields (inviteCode is optional)
  if (
    [name, phone, gender, workerType, password].some(
      (field) => !field || field.trim() === ""
    )
  ) {
    throw new ApiError(400, "All required fields must be provided");
  }

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new ApiError(409, "User with this phone already exists");
  }


  // Owner is optional – if an invite code is supplied, attach the worker to that owner.
  let ownerId = null;
  if (inviteCode) {
    const owner = await User.findOne({ inviteCode, role: UserRoles.OWNER });
    if (!owner) {
      throw new ApiError(400, "Invalid contractor invite code");
    }
    ownerId = owner._id;
  }


  const photoLocalPath = req.files?.photo?.[0]?.path;
  if (!photoLocalPath) {
    throw new ApiError(400, "Worker photo is required");
  }

  const photoUpload = await uploadOnCloudinary(photoLocalPath);
  if (!photoUpload) {
    throw new ApiError(500, "Photo upload failed");
  }

  let aadharUpload = null;
  if (req.files?.aadhar?.[0]?.path) {
    aadharUpload = await uploadOnCloudinary(req.files.aadhar[0].path);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

 
  const worker = await User.create({
    name,
    phone,
    gender,
    workerType,
    password: hashedPassword,
    photo: photoUpload.url,
    aadhar: aadharUpload?.url || "",
    role: UserRoles.WORKER,
    status: UserStatus.PENDING,
    ownerId: ownerId,
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

export const getMyEarningSummary = asyncHandler(async (req, res) => {
  const workerId = req.user.userId;
  const worker = await User.findById(workerId);
  if (!worker) throw new ApiError(404, "Worker not found");

  const ownerId = worker.ownerId;

  // 1. Get all payments recorded for this worker
  const payments = await Payment.find({ workerId });
  const totalPaid = payments.reduce((sum, p) => sum + p.paidAmount, 0);

  // 2. Get all attendance records for this worker
  const attendanceRecords = await Attendance.find({ workerId });

  // 3. Get relevant rates for this owner/workerType
  const rates = await Rate.find({ 
    ownerId, 
    workerType: worker.workerType,
    isActive: true 
  });

  // 4. Calculate live earnings
  let totalEarned = 0;
  attendanceRecords.forEach(a => {
      // Find rate for this specific site or global fallback
      let rate = rates.find(r => r.siteId?.toString() === a.siteId?.toString());
      if (!rate) {
          rate = rates.find(r => !r.siteId);
      }

      if (rate) {
          const standardHours = 8;
          const baseWage = a.hoursWorked >= standardHours ? rate.dailyRate : (rate.dailyRate / standardHours) * a.hoursWorked;
          const otWage = a.overtimeHours * rate.overtimeRatePerHour;
          totalEarned += (baseWage + otWage);
      }
  });

  const roundedEarned = Math.round(totalEarned);
  const pendingAmount = roundedEarned - totalPaid;

  return res.status(200).json(
    new ApiResponse(200, {
      totalEarned: roundedEarned,
      totalPaid,
      pendingAmount,
      daysPresent: attendanceRecords.length
    }, "Earning summary fetched successfully")
  );
});
