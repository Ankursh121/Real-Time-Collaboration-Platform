import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * ==========================================================
 * 🔐 Generate Access Token
 * ==========================================================
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

// Signup of user - 

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password : hashedPassword,
      role,
    });

    // generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30d" }
    );

    res.status(201).json({
      success: true,
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
/**
 * ==========================================================
 * 1️⃣ LOGIN USER (Owner / Admin / Worker)
 * ==========================================================
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    throw new ApiError(400, "Phone and password are required");
  }

  // Fetch user with password
  const user = await User.findOne({ phone }).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Compare password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid credentials");
  }

  // Block pending workers
  if (user.role === "WORKER" && user.status !== "ACTIVE") {
    throw new ApiError(
      403,
      "Your account is pending approval by the contractor"
    );
  }

  // Generate token
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
 * 2️⃣ LOGOUT USER
 * ==========================================================
 * @route   POST /api/auth/logout
 * @access  Protected
 */
export const logoutUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

/**
 * ==========================================================
 * 3️⃣ GET CURRENT LOGGED-IN USER
 * ==========================================================
 * @route   GET /api/auth/me
 * @access  Protected
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.userId).select(
    "-password -OTP"
  );

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, user, "Current user fetched successfully")
  );
});
