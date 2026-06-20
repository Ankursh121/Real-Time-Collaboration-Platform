import Rate from "../models/rate.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const createRate = asyncHandler(async (req, res) => {
  const { siteId, workerType, dailyRate } = req.body;
  const ownerId = req.user.userId;

  if (!workerType || dailyRate == null) {
    throw new ApiError(400, "All fields are required");
  }

  const computedOT = dailyRate / 8;

  // Deactivate existing active rate for this combination if it exists
  await Rate.updateMany(
    { ownerId, siteId, workerType, isActive: true },
    { isActive: false }
  );

  const rate = await Rate.create({
    ownerId,
    siteId: siteId || null,
    workerType,
    dailyRate,
    overtimeRatePerHour: computedOT,
    isActive: true,
  });

  return res.status(201).json(
    new ApiResponse(201, rate, "Rate configuration saved successfully")
  );
});

export const getRates = asyncHandler(async (req, res) => {
  const ownerId = req.user.userId;
  const rates = await Rate.find({ ownerId }).populate("siteId", "name");

  return res.status(200).json(
    new ApiResponse(200, rates, "Rates fetched successfully")
  );
});

export const getActiveRatesForSite = asyncHandler(async (req, res) => {
    const { siteId } = req.params;
    const ownerId = req.user.userId;

    const rates = await Rate.find({ 
        ownerId, 
        siteId: siteId === "global" ? null : siteId, 
        isActive: true 
    });

    return res.status(200).json(
        new ApiResponse(200, rates, "Active site rates fetched successfully")
    );
});

export const deleteRate = asyncHandler(async (req, res) => {
  const { rateId } = req.params;
  const ownerId = req.user.userId;

  const rate = await Rate.findOne({ _id: rateId, ownerId });
  if (!rate) throw new ApiError(404, "Rate configuration not found");

  await rate.deleteOne();

  return res.status(200).json(
    new ApiResponse(200, {}, "Rate configuration deleted successfully")
  );
});
