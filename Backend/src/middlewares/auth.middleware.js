import jwt from "jsonwebtoken";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { UserStatus } from "../constants/user.constants.js";

 const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized: Access token missing");
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded?.userId) {
      throw new ApiError(401, "Invalid access token");
    }

    const user = await User.findById(decoded.userId).select(
      "_id role status ownerId workerType siteId name inviteCode"
    );

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new ApiError(
        403,
        "Your account is pending approval by the owner"
      );
    }

    req.user = {
      userId: user._id,
      role: user.role,
      ownerId: user.ownerId,
      workerType: user.workerType,
      siteId: user.siteId,
      name: user.name,
      inviteCode: user.inviteCode
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      throw new ApiError(401, "Invalid token");
    }

    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired, please login again");
    }

    throw error;
  }
});

export {verifyJWT};
