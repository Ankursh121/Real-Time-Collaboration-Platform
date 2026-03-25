import jwt from "jsonwebtoken";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * 🔐 Generate Access Token
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
      ownerId: user.ownerId,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
    }
  );
};

/**
 * ==========================================================
 * 1️⃣ SEND OTP
 * ==========================================================
 * @route POST /api/auth/send-otp
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  // generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  let user = await User.findOne({ phone });

  if (!user) {
    // create minimal user
    user = await User.create({
      phone,
      name: "Temp",
      gender: "Male",
    });
  }

  user.OTP = otp;
  user.OTPExpiresAt = otpExpiry;

  await user.save();

  console.log("OTP:", otp); // 🔥 for testing

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully"));
});

/**
 * ==========================================================
 * 2️⃣ VERIFY OTP (Login + Signup)
 * ==========================================================
 * @route POST /api/auth/verify-otp
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, name, role, inviteCode } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone and OTP are required");
  }

  const user = await User.findOne({ phone }).select("+OTP");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // validate OTP
  if (!user.OTP || user.OTP !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.OTPExpiresAt < new Date()) {
    throw new ApiError(400, "OTP expired");
  }

  // update user info (signup case)
  if (name) user.name = name;
  if (role) user.role = role;

  // worker invite code logic
  if (role === "Worker" && inviteCode) {
    const owner = await User.findOne({ inviteCode });

    if (!owner) {
      throw new ApiError(400, "Invalid invite code");
    }

    user.ownerId = owner._id;
    user.status = "Active";
  }

  // clear OTP
  user.OTP = undefined;
  user.OTPExpiresAt = undefined;

  await user.save();

  const accessToken = generateAccessToken(user);

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    })
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          user: {
            _id: user._id,
            name: user.name,
            role: user.role,
          },
        },
        "Login successful"
      )
    );
});

/**
 * ==========================================================
 * 3️⃣ LOGOUT USER
 * ==========================================================
 */
export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * ==========================================================
 * 4️⃣ GET CURRENT USER
 * ==========================================================
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password -OTP");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});