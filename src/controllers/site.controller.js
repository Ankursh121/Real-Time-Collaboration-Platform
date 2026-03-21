import Site from "../models/site.models.js";
import User from "../models/users.models.js";
import  ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * ==========================================================
 * 1️⃣ CREATE SITE
 * ==========================================================
 * @route   POST /api/sites
 * @access  OWNER
 */
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

/**
 * ==========================================================
 * 2️⃣ GET ALL SITES (Owner Only)
 * ==========================================================
 * @route   GET /api/sites
 * @access  OWNER
 */
export const getSites = asyncHandler(async (req, res) => {
  const sites = await Site.find({
    ownerId: req.user.userId,
  }).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, sites, "Sites fetched successfully")
  );
});

/**
 * ==========================================================
 * 3️⃣ GET SINGLE SITE
 * ==========================================================
 * @route   GET /api/sites/:siteId
 * @access  OWNER
 */
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

/**
 * ==========================================================
 * 4️⃣ UPDATE SITE
 * ==========================================================
 * @route   PATCH /api/sites/:siteId
 * @access  OWNER
 */
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

/**
 * ==========================================================
 * 5️⃣ DEACTIVATE SITE
 * ==========================================================
 * @route   PATCH /api/sites/deactivate/:siteId
 * @access  OWNER
 */
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

/**
 * ==========================================================
 * 6️⃣ ASSIGN WORKER TO SITE
 * ==========================================================
 * @route   PATCH /api/sites/assign-worker/:siteId
 * @access  OWNER
 */
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
    role: { $in: ["WORKER", "ADMIN"] },
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
