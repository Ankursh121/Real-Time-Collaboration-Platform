import Attendance from "../models/attendance.models.js";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";

/**
 * @desc    Mark attendance (Admin or Owner)
 * @route   POST /api/attendance/mark
 * @access  ADMIN or OWNER
 */

export const markAttendance = asyncHandler(async (req, res) => {
  const { workerId, siteId, hoursWorked, overtimeHours, date, remark } =
    req.body;

  if (!workerId || !siteId || hoursWorked === undefined || !date) {
    throw new ApiError(400, "Required fields are missing");
  }

  // Normalize date (important)
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Check worker exists
  const worker = await User.findById(workerId);

  if (!worker) {
    throw new ApiError(404, "Worker not found");
  }

  // Ensure worker belongs to same contractor
  if (worker.ownerId.toString() !== req.user.ownerId?.toString()) {
    throw new ApiError(403, "Unauthorized action");
  }

  // Admin restriction: can only mark attendance for WORKER role
  if (req.user.role === "ADMIN" && worker.role !== "WORKER") {
    throw new ApiError(
      403,
      "Admins can mark attendance only for workers"
    );
  }

  // Create attendance
  const attendance = await Attendance.create({
    ownerId: req.user.ownerId,
    siteId,
    workerId,
    date: attendanceDate,
    hoursWorked,
    overtimeHours: overtimeHours || 0,
    markedBy: req.user.userId,
    remark,
  });

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
    data: attendance,
  });
});
