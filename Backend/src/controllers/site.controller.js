import Site from "../models/site.models.js";
import User from "../models/users.models.js";
import Attendance from "../models/attendance.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles } from "../constants/user.constants.js";
import twilio from "twilio";


export const createSite = asyncHandler(async (req, res) => {
  const { name, location, description, startDate } = req.body;

  if (!name || !location) {
    throw new ApiError(400, "Site name and location are required");
  }

  const site = await Site.create({
    ownerId: req.user.userId,
    name,
    location,
    description,
    startDate: startDate || new Date(),
  });

  return res.status(201).json(
    new ApiResponse(201, site, "Site created successfully")
  );
});


export const getSites = asyncHandler(async (req, res) => {
  const sites = await Site.find({
    ownerId: req.user.userId,
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, sites, "Sites fetched successfully")
  );
});


export const getSingleSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;

  const site = await Site.findOne({
    _id: siteId,
    ownerId: req.user.userId,
  });

  if (!site) {
    throw new ApiError(404, "Site not found");
  }

  return res.status(200).json(
    new ApiResponse(200, site, "Site fetched successfully")
  );
});


export const updateSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { name, location, description, endDate } = req.body;

  const site = await Site.findOne({
    _id: siteId,
    ownerId: req.user.userId,
  });

  if (!site) {
    throw new ApiError(404, "Site not found");
  }

  if (name) site.name = name;
  if (location) site.location = location;
  if (description) site.description = description;
  if (endDate) site.endDate = endDate;

  await site.save();

  return res.status(200).json(
    new ApiResponse(200, site, "Site updated successfully")
  );
});


export const deactivateSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;

  const site = await Site.findOne({
    _id: siteId,
    ownerId: req.user.userId,
  });

  if (!site) {
    throw new ApiError(404, "Site not found");
  }

  site.isActive = false;
  site.endDate = new Date();

  await site.save();

  return res.status(200).json(
    new ApiResponse(200, site, "Site deactivated successfully")
  );
});


export const assignWorkerToSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { workerId } = req.body;

  if (!workerId) {
    throw new ApiError(400, "Worker ID is required");
  }

  const site = await Site.findOne({
    _id: siteId,
    ownerId: req.user.userId,
  });

  if (!site) {
    throw new ApiError(404, "Site not found");
  }

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    role: { $in: [UserRoles.WORKER, UserRoles.ADMIN] },
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  worker.siteId = site._id;
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Worker assigned to site successfully")
  );
});

export const getSiteStats = asyncHandler(async (req, res) => {
  const { siteId } = req.params;

  const totalWorkersOnSite = await User.countDocuments({
    siteId,
    ownerId: req.user.userId,
    role: { $in: [UserRoles.WORKER, UserRoles.ADMIN] },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceToday = await Attendance.countDocuments({
    siteId,
    date: { $gte: today },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalWorkersOnSite,
        attendanceToday,
      },
      "Site stats fetched successfully"
    )
  );
});

export const removeWorkerFromSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { workerId } = req.body;

  if (!workerId) {
    throw new ApiError(400, "Worker ID is required");
  }

  const site = await Site.findOne({
    _id: siteId,
    ownerId: req.user.userId,
  });

  if (!site) {
    throw new ApiError(404, "Site not found");
  }

  const worker = await User.findOne({
    _id: workerId,
    ownerId: req.user.userId,
    siteId: site._id,
  });

  if (!worker) {
    throw new ApiError(404, "Worker not found on this site");
  }

  worker.siteId = null;
  await worker.save();

  return res.status(200).json(
    new ApiResponse(200, worker, "Worker removed from site successfully")
  );
});

// Step 1: Owner requests site deletion — sends OTP to their phone
export const requestSiteDelete = asyncHandler(async (req, res) => {
  const { siteId } = req.params;

  const site = await Site.findOne({ _id: siteId, ownerId: req.user.userId });
  if (!site) throw new ApiError(404, "Site not found");

  const owner = await User.findById(req.user.userId);
  if (!owner) throw new ApiError(404, "Owner not found");
  if (!owner.phone) throw new ApiError(400, "No phone number on file");

  // Reuse same dummy OTP pattern as auth
  const otp = "123456";
  owner.OTP = otp;
  owner.OTPExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
  await owner.save();

  console.log(`[Site Delete OTP] Site: ${site.name} | OTP: ${otp}`);

  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_ACCOUNT_SID !== "placeholder_account_sid") {
    try {
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const formattedPhone = owner.phone.startsWith("+") ? owner.phone : `+91${owner.phone}`;
      await client.messages.create({
        body: `WARNING: OTP to permanently delete site "${site.name}" is ${otp}. Valid 5 mins. Do NOT share.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });
    } catch (err) {
      console.error("Twilio error:", err.message);
    }
  }

  return res.status(200).json(new ApiResponse(200, {}, "Deletion OTP sent to your registered number"));
});

// Step 2: Owner confirms deletion with OTP — permanently deletes site
export const confirmSiteDelete = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const { otp } = req.body;

  if (!otp) throw new ApiError(400, "OTP is required");

  const site = await Site.findOne({ _id: siteId, ownerId: req.user.userId });
  if (!site) throw new ApiError(404, "Site not found");

  const owner = await User.findById(req.user.userId).select("+OTP");
  if (!owner?.OTP || owner.OTP !== otp) throw new ApiError(400, "Invalid OTP");
  if (owner.OTPExpiresAt < new Date()) throw new ApiError(400, "OTP expired");

  // Clear OTP
  owner.OTP = undefined;
  owner.OTPExpiresAt = undefined;
  await owner.save();

  // Unassign all workers from this site
  await User.updateMany({ siteId: site._id }, { $unset: { siteId: 1 } });

  // Permanently delete site
  await site.deleteOne();

  return res.status(200).json(new ApiResponse(200, {}, `Site "${site.name}" has been permanently deleted`));
});
