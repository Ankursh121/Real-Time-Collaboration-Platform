import User from "../models/users.models.js";
import Attendance from "../models/attendance.models.js";
import Payment from "../models/payment.models.js";
import { uploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import bcrypt from "bcrypt";


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


  const owner = await User.findOne({
    inviteCode,
    role: UserRoles.OWNER,
  });

  if (!owner) {
    throw new ApiError(400, "Invalid contractor invite code");
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
