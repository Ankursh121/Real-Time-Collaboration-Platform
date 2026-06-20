import Attendance from "../models/attendance.models.js";
import User from "../models/users.models.js";
import Payment from "../models/payment.models.js";
import ApiError from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UserRoles } from "../constants/user.constants.js";


export const markAttendance = asyncHandler(async (req, res) => {
  const { workerId, siteId, hoursWorked, overtimeHours, date, remark } =
    req.body;

  if (!workerId || !siteId || hoursWorked === undefined || !date) {
    throw new ApiError(400, "Required fields are missing");
  }


  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);


  const worker = await User.findById(workerId);

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  // Admin cannot mark their own attendance
  if (req.user.role === UserRoles.ADMIN && workerId.toString() === req.user.userId.toString()) {
    throw new ApiError(403, "Admins cannot mark their own attendance");
  }

  // Determine the ownerId based on the marking user's role
  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;

  // Verify that the worker belongs to the same owner organization
  const workerOwnerId = worker.ownerId?.toString();
  const markOwnerId = effectiveOwnerId?.toString();

  if (workerOwnerId !== markOwnerId) {
    throw new ApiError(403, `This worker does not belong to you (belongs to owner ${workerOwnerId}, but you are under owner ${markOwnerId})`);
  }

  if (req.user.role === UserRoles.ADMIN && worker.role !== UserRoles.WORKER) {
    throw new ApiError(
      403,
      "Admins can mark attendance only for workers"
    );
  }

  try {
    const attendance = await Attendance.create({
      ownerId: effectiveOwnerId,
      siteId,
      workerId,
      date: attendanceDate,
      hoursWorked,
      overtimeHours: overtimeHours || 0,
      markedBy: req.user.userId,
      remark,
    });

    return res.status(201).json(
      new ApiResponse(201, attendance, "Attendance marked successfully")
    );
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, "Attendance already marked for this worker on this date");
    }
    throw error;
  }
});

export const getWorkerAttendanceHistory = asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  const worker = await User.findById(workerId);
  if (!worker) throw new ApiError(404, "Worker not found");

  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;
  
  // Allow workers to see their own history, otherwise check ownership
  if (req.user.role === UserRoles.WORKER) {
    if (workerId.toString() !== req.user.userId.toString()) {
      throw new ApiError(403, "Workers can only access their own history");
    }
  } else if (worker.ownerId?.toString() !== effectiveOwnerId?.toString()) {
    throw new ApiError(403, "Unauthorized access to worker data");
  }

  // Find all family members
  const familyMembers = await User.find({ parentWorkerId: workerId });
  const ids = [workerId, ...familyMembers.map((m) => m._id)];

  // Calculate the date range (Last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const history = await Attendance.find({
    workerId: { $in: ids },
    date: { $gte: thirtyDaysAgo }
  })
  .sort({ date: -1 })
  .populate("workerId", "name phone")
  .populate("siteId", "name location");

  // Also fetch payments for the same period
  const payments = await Payment.find({
    workerId: { $in: ids },
    ownerId: effectiveOwnerId,
    createdAt: { $gte: thirtyDaysAgo }
  })
  .sort({ createdAt: -1 })
  .populate("workerId", "name phone");

  return res.status(200).json(
    new ApiResponse(200, { 
      attendance: history, 
      payments,
      familyMembers,
      workerProfile: {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        workerType: worker.workerType,
        DailyRate: worker.DailyRate,
        photo: worker.photo,
        aadhar: worker.aadhar,
        status: worker.status,
        siteId: worker.siteId,
      }
    }, "Worker financial and attendance history fetched")
  );
});
