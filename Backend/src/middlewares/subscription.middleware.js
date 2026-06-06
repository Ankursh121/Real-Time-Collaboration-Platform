import Subscription from "../models/subscription.models.js";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const checkWorkerLimit = asyncHandler(async (req, res, next) => {
  let ownerId;

  if (req.user) {
    // Action performed by Owner/Admin
    if (req.user.role === "Worker") return next();
    ownerId = req.user.role === "Owner" ? req.user.userId : req.user.ownerId;
  } else if (req.body && req.body.inviteCode) {
    // Action performed by Worker during registration
    const owner = await User.findOne({ inviteCode: req.body.inviteCode, role: "Owner" });
    if (!owner) throw new ApiError(400, "Invalid contractor invite code");
    ownerId = owner._id;
  } else {
    return next();
  }

  let subscription = await Subscription.findOne({ ownerId });

  if (!subscription) {
    subscription = await Subscription.create({
      ownerId,
      plan: "free",
      workerLimit: 10,
      status: "active"
    });
  }

  if (subscription.status !== "active" && subscription.plan !== "free") {
    throw new ApiError(403, "The contractor's subscription is not active. Please contact the contractor.");
  }

  const currentWorkerCount = await User.countDocuments({ 
    ownerId, 
    role: "Worker", 
    status: "Active" 
  });

  if (currentWorkerCount >= subscription.workerLimit) {
    throw new ApiError(403, `Worker limit reached (${subscription.workerLimit}). The contractor needs to upgrade their plan.`);
  }

  next();
});
