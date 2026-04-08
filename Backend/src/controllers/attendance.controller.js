import Attendance from "../models/attendance.models.js";
import User from "../models/users.models.js";
import ApiError from "../utils/ApiError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
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

  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;


  if (worker.ownerId?.toString() !== effectiveOwnerId?.toString()) {
    throw new ApiError(403, "Unauthorized action: This worker does not belong to you");
  }

  if (req.user.role === UserRoles.ADMIN && worker.role !== UserRoles.WORKER) {
    throw new ApiError(
      403,
      "Admins can mark attendance only for workers"
    );
  }

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

  res.status(201).json({
    success: true,
    message: "Attendance marked successfully",
    data: attendance,
  });
});
