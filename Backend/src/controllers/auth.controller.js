import jwt from "jsonwebtoken";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles, UserStatus } from "../constants/user.constants.js";
import crypto from "crypto";
import fs from "fs";
import { verifyFirebaseToken } from "../configs/firebase.js";
import { uploadOnCloudinary, DeleteOnCloudinary } from "../utils/Cloudinary.js";


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


export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone: rawPhone, firebaseToken, name, role, workerType, inviteCode } = req.body;
  let phone = rawPhone?.trim();

  let user;

  if (!firebaseToken) {
    throw new ApiError(400, "Firebase ID token is required");
  }

  // Google Sign-In verification flow
  const decodedClaims = await verifyFirebaseToken(firebaseToken);
  const { email, firebaseUid, name: decodedName } = decodedClaims;

  // Check if user exists by firebaseUid or email
  user = await User.findOne({ $or: [{ firebaseUid }, { email }] });

  if (!user) {
    // User is not in DB. Check if this is a registration request.
    // If role is present, proceed to register the user.
    if (role) {
      if (!phone) {
        throw new ApiError(400, "Phone number is required for registration");
      }

      // Check if role is valid
      if (!Object.values(UserRoles).includes(role)) {
        throw new ApiError(400, "Invalid role");
      }

      // Check if phone number is already registered
      const existingUserByPhone = await User.findOne({ phone });
      if (existingUserByPhone) {
        if (!existingUserByPhone.firebaseUid) {
          // Link existing user to this Google account
          existingUserByPhone.firebaseUid = firebaseUid;
          existingUserByPhone.email = email;
          if (name) existingUserByPhone.name = name;
          existingUserByPhone.role = role;
          if (workerType && workerType.trim() !== "") {
            existingUserByPhone.workerType = workerType.trim();
          } else {
            existingUserByPhone.workerType = undefined;
          }
          if (!existingUserByPhone.ownerId) {
            existingUserByPhone.status = role === UserRoles.OWNER ? UserStatus.ACTIVE : UserStatus.PENDING;
          } else {
            existingUserByPhone.status = UserStatus.ACTIVE;
          }
          user = existingUserByPhone;
        } else {
          throw new ApiError(409, "This phone number is already registered with another Google account");
        }
      } else {
        try {
          user = await User.create({
            phone,
            name: name || decodedName || email.split("@")[0],
            email,
            firebaseUid,
            role,
            ...(workerType && workerType.trim() !== "" ? { workerType: workerType.trim() } : {}),
            gender: "Others", // default gender since DB schema requires it
            status: role === UserRoles.OWNER ? UserStatus.ACTIVE : UserStatus.PENDING,
          });
        } catch (err) {
          if (err.code === 11000) {
            user = await User.findOne({ phone });
            if (!user) throw err;
          } else {
            throw err;
          }
        }
      }
    } else {
      // Not a registration request (just a login attempt). Return 404.
      throw new ApiError(404, "User not found. Please register first.");
    }
  } else {
    // User exists. Update email and firebaseUid if they were missing (backward compatibility / linking)
    let needsSave = false;
    if (!user.firebaseUid) {
      user.firebaseUid = firebaseUid;
      needsSave = true;
    }
    if (!user.email) {
      user.email = email;
      needsSave = true;
    }
    if (needsSave) {
      await user.save();
    }
  }

  // Handle owner linkage and invite code for Google Login
  if (role) {
    if (user.role === UserRoles.WORKER || user.role === UserRoles.ADMIN || user.role === UserRoles.SUBCONTRACTOR) {
        if (inviteCode && inviteCode.trim() !== "") {
          const normalizedCode = inviteCode.trim().toUpperCase();
          console.log(`[DEBUG] Looking for owner with code: "${normalizedCode}"`);
          
          let owner;
          if (user.role === UserRoles.WORKER) {
            owner = await User.findOne({
              $or: [{ workerInviteCode: normalizedCode }, { inviteCode: normalizedCode }],
              role: UserRoles.OWNER
            });
          } else if (user.role === UserRoles.ADMIN) {
            owner = await User.findOne({
              $or: [{ adminInviteCode: normalizedCode }, { inviteCode: normalizedCode }],
              role: UserRoles.OWNER
            });
          } else {
            owner = await User.findOne({ inviteCode: normalizedCode, role: UserRoles.OWNER });
          }

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
    }
  }

  if (user.role === UserRoles.OWNER) {
      user.status = UserStatus.ACTIVE;
      if (!user.inviteCode) {
          user.inviteCode = "O-" + crypto.randomBytes(3).toString("hex").toUpperCase();
      }
      if (!user.workerInviteCode || user.workerInviteCode === user.inviteCode) {
          user.workerInviteCode = "W-" + crypto.randomBytes(3).toString("hex").toUpperCase();
      }
      if (!user.adminInviteCode || user.adminInviteCode === user.inviteCode || user.adminInviteCode === user.workerInviteCode) {
          user.adminInviteCode = "A-" + crypto.randomBytes(3).toString("hex").toUpperCase();
      }
  }

  await user.save();

  const accessToken = generateAccessToken(user);

  let ownerData = null;
  if (user.ownerId) {
    const owner = await User.findById(user.ownerId).select("name");
    if (owner) ownerData = { name: owner.name };
  }

  console.log(`[DEBUG] Verification successful for user: ${user.phone}`);
  try { fs.appendFileSync("backend_errors.log", `[DEBUG] Verification successful for user: ${user.phone}\n`); } catch(e) {}

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
            workerInviteCode: user.workerInviteCode,
            adminInviteCode: user.adminInviteCode,
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

export const updateProfilePhoto = asyncHandler(async (req, res) => {
  const photoLocalPath = req.file?.path;
  if (!photoLocalPath) {
    throw new ApiError(400, "Photo file is required");
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Delete previous photo if it exists on Cloudinary
  if (user.photo) {
    await DeleteOnCloudinary(user.photo);
  }

  const photoUpload = await uploadOnCloudinary(photoLocalPath);
  if (!photoUpload) {
    throw new ApiError(500, "Photo upload failed");
  }

  user.photo = photoUpload.url;
  await user.save();

  const updatedUser = await User.findById(req.user.userId).select("-password -OTP");

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedUser,
      "Profile photo updated successfully"
    )
  );
});