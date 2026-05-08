import jwt from "jsonwebtoken";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import crypto from "crypto";
import twilio from "twilio";
import fs from "fs";


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


export const sendOTP = asyncHandler(async (req, res) => {
  console.log("sendOTP Request Body:", req.body);
  const { phone: rawPhone, isRegistration } = req.body;
  const phone = rawPhone?.trim();

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  let user = await User.findOne({ phone });

  // Logical Gatekeeping:
  if (isRegistration) {
    // We allow registration flow even if user exists. 
    // It will act as a registration update/re-verification.
  } else {
    // Login attempt
    if (!user) {
        throw new ApiError(404, `Phone ${phone} not found. Please register first.`);
    }
  }

  // Generate OTP
  const otp = "123456"; // Dummy OTP for development
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  if (!user) {
    // Special case for registration: Create a preliminary record to hold the OTP
    // We only reach here if isRegistration is true and user was null
    user = await User.create({
      phone,
      name: "Temp",
      gender: "Others",
      role: UserRoles.WORKER,
      status: UserStatus.PENDING,
    });
  }

  user.OTP = otp;
  user.OTPExpiresAt = otpExpiry;
  console.log(`Setting OTP for ${phone}: ${otp}`);
  await user.save();

  console.log(`OTP for ${phone}:`, otp); 

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== "placeholder_account_sid") {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      
      const formattedPhone = phone.startsWith("+") ? phone : `+91${phone}`; // Auto add +91 country code if missing
      
      await client.messages.create({
        body: `Your platform login OTP is: ${otp}. Do not share this with anyone. Valid for 5 mins.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      console.log(`Twilio SMS dispatched to ${formattedPhone}`);
    } catch (smsError) {
      console.error("Twilio Integration Error:", smsError.message);
      // We continue even if SMS fails so it doesn't break app flow if Twilio trial restricts accounts.
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "OTP sent successfully"));
});


export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone: rawPhone, otp, name, role, workerType, inviteCode } = req.body;
  const phone = rawPhone?.trim();

  if (!phone || !otp) {
    throw new ApiError(400, "Phone and OTP are required");
  }

  const user = await User.findOne({ phone }).select("+OTP");

  if (!user) {
    throw new ApiError(404, "User not found");
  }


  const dbOtp = user.OTP?.toString().trim();
  const inputOtp = otp?.toString().trim();
  
  console.log(`[DEBUG] DB OTP: "${dbOtp}", Input OTP: "${inputOtp}"`);
  try { fs.appendFileSync("backend_errors.log", `[DEBUG] DB OTP: "${dbOtp}", Input OTP: "${inputOtp}"\n`); } catch(e) {}

  if (!user.OTP || dbOtp !== inputOtp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (user.OTPExpiresAt < new Date()) {
    throw new ApiError(400, "OTP expired");
  }

  if (name) user.name = name;
  if (role) {
      if (!Object.values(UserRoles).includes(role)) {
          throw new ApiError(400, "Invalid role");
      }
      user.role = role;
  }
  if (workerType) {
      user.workerType = workerType;
  }


  if (user.role === UserRoles.WORKER || user.role === UserRoles.ADMIN) {
      if (inviteCode) {
        const normalizedCode = inviteCode.trim().toUpperCase();
        console.log(`[DEBUG] Looking for owner with code: "${normalizedCode}"`);
        const owner = await User.findOne({ inviteCode: normalizedCode, role: UserRoles.OWNER });

        if (!owner) {
          console.log(`[DEBUG] Owner not found for code: "${normalizedCode}"`);
          try { fs.appendFileSync("backend_errors.log", `[DEBUG] Owner not found for code: "${normalizedCode}"\n`); } catch(e) {}
          throw new ApiError(400, "Invalid or expired owner invite code");
        }

        user.ownerId = owner._id;
        user.status = UserStatus.ACTIVE;
      } else if (!user.status || user.status === UserStatus.PENDING) {
          user.status = UserStatus.PENDING;
      }
      // If user is already ACTIVE, we don't reset them to PENDING when inviteCode is missing (e.g. during login)
  } else if (user.role === UserRoles.OWNER) {
      user.status = UserStatus.ACTIVE;
      if (!user.inviteCode) {
          user.inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      }
  }

  user.OTP = undefined;
  user.OTPExpiresAt = undefined;

  await user.save();

  const accessToken = generateAccessToken(user);

  let ownerData = null;
  if (user.ownerId) {
    const owner = await User.findById(user.ownerId).select("name");
    if (owner) ownerData = { name: owner.name };
  }

  console.log(`[DEBUG] Verification successful for ${phone}`);
  try { fs.appendFileSync("backend_errors.log", `[DEBUG] Verification successful for ${phone}\n`); } catch(e) {}

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
            inviteCode: user.inviteCode,
            owner: ownerData
          },
        },
        "Login successful"
      )
    );
});


export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select("-password -OTP").populate("ownerId", "name");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Format owner mapping identically to verifyOTP
  const formattedUser = user.toObject();
  if (formattedUser.ownerId) {
     formattedUser.owner = { name: formattedUser.ownerId.name };
     delete formattedUser.ownerId;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, formattedUser, "User fetched successfully"));
});