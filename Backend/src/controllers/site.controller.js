import Site from "../models/site.models.js";
import User from "../models/users.models.js";
import Attendance from "../models/attendance.models.js";
import Payment from "../models/payment.models.js";
import Rate from "../models/rate.models.js";
import PDFDocument from "pdfkit";
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
  const query = {};
  
  if (req.user.role === UserRoles.OWNER) {
    query.ownerId = req.user.userId;
  } else if (req.user.role === UserRoles.ADMIN) {
    if (!req.user.siteId) {
       return res.status(200).json(new ApiResponse(200, [], "Admin has no assigned site"));
    }
    query._id = req.user.siteId;
  } else {
    throw new ApiError(403, "Unauthorized role");
  }

  const sites = await Site.find(query).sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, sites, "Sites fetched successfully")
  );
});


export const getSingleSite = asyncHandler(async (req, res) => {
  const { siteId } = req.params;

  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;

  const query = { _id: siteId, ownerId: effectiveOwnerId };
  if (req.user.role === UserRoles.ADMIN && req.user.siteId?.toString() !== siteId) {
     throw new ApiError(403, "Admins can only access their assigned site");
  }

  const site = await Site.findOne(query);

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

  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: effectiveOwnerId,
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

  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;

  const totalWorkersOnSite = await User.countDocuments({
    siteId,
    ownerId: effectiveOwnerId,
    role: { $in: [UserRoles.WORKER, UserRoles.ADMIN] },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceToday = await Attendance.countDocuments({
    siteId,
    date: { $gte: today },
  });

  const lastAttendance = await Attendance.findOne({ siteId })
    .sort({ createdAt: -1 })
    .select("createdAt");

  const retentionRate = totalWorkersOnSite > 0 
    ? Math.round((attendanceToday / totalWorkersOnSite) * 100) 
    : 0;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalWorkersOnSite,
        attendanceToday,
        lastActivity: lastAttendance?.createdAt || null,
        retentionRate,
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

  const effectiveOwnerId = req.user.role === UserRoles.OWNER ? req.user.userId : req.user.ownerId;

  const worker = await User.findOne({
    _id: workerId,
    ownerId: effectiveOwnerId,
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

export const getSiteReportData = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const ownerId = req.user.userId;

  const site = await Site.findOne({ _id: siteId, ownerId });
  if (!site) throw new ApiError(404, "Site not found");

  const workers = await User.find({ siteId, ownerId, role: "Worker" });
  
  const reportData = [];

  for (const worker of workers) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const attendances = await Attendance.find({
      workerId: worker._id,
      siteId,
      date: { $gte: startOfMonth }
    });

    const rate = await Rate.findOne({ 
      ownerId, 
      siteId, 
      workerType: worker.workerType,
      isActive: true 
    });

    let estEarnings = 0;
    if (rate) {
      attendances.forEach(a => {
        const base = (rate.dailyRate / 8) * a.hoursWorked;
        const ot = a.overtimeHours * rate.overtimeRatePerHour;
        estEarnings += (base + ot);
      });
    }

    reportData.push({
      name: worker.name,
      workerType: worker.workerType || "N/A",
      phone: worker.phone,
      earnings: estEarnings.toFixed(2),
      attendanceCount: attendances.length
    });
  }

  return res.status(200).json(
    new ApiResponse(200, { site, reportData }, "Report data fetched successfully")
  );
});

export const generateSiteReport = asyncHandler(async (req, res) => {
  const { siteId } = req.params;
  const ownerId = req.user.userId;

  const site = await Site.findOne({ _id: siteId, ownerId });
  if (!site) throw new ApiError(404, "Site not found");

  const workers = await User.find({ siteId, ownerId, role: "Worker" });
  
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=Report_${site.name.replace(/\s+/g, "_")}.pdf`);
  
  doc.pipe(res);

  // Header
  doc.fontSize(25).text("WorksitePro - Site Report", { align: "center" });
  doc.moveDown();
  doc.fontSize(16).text(`Site Name: ${site.name}`);
  doc.fontSize(12).text(`Location: ${site.location}`);
  doc.text(`Generated On: ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  // Workforce Summary
  doc.fontSize(14).text("Workforce Summary", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Total Workers Assigned: ${workers.length}`);
  doc.moveDown();

  // Worker Details Table Header
  const tableTop = doc.y;
  doc.fontSize(10).font("Helvetica-Bold");
  doc.text("Worker Name", 50, tableTop);
  doc.text("Type", 200, tableTop);
  doc.text("Phone", 300, tableTop);
  doc.text("Earnings (Est)", 450, tableTop);
  
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.font("Helvetica");

  // Worker Data Rows
  for (const worker of workers) {
    if (doc.y > 700) doc.addPage();
    
    const y = doc.y;
    doc.text(worker.name, 50, y);
    doc.text(worker.workerType || "N/A", 200, y);
    doc.text(worker.phone, 300, y);
    
    // Quick estimation for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);

    const attendances = await Attendance.find({
      workerId: worker._id,
      siteId,
      date: { $gte: startOfMonth }
    });

    const rate = await Rate.findOne({ 
      ownerId, 
      siteId, 
      workerType: worker.workerType,
      isActive: true 
    });

    let estEarnings = 0;
    if (rate) {
      attendances.forEach(a => {
        const base = (rate.dailyRate / 8) * a.hoursWorked;
        const ot = a.overtimeHours * rate.overtimeRatePerHour;
        estEarnings += (base + ot);
      });
    }

    doc.text(`Rs. ${estEarnings.toFixed(2)}`, 450, y);
    doc.moveDown();
  }

  // Footer
  doc.moveDown(2);
  doc.fontSize(10).text("Generated by WorksitePro - Modern Workforce Management", { align: "center", color: "grey" });
  
  doc.end();
});
