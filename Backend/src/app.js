import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import fs from "fs";


dotenv.config();

import morgan from "morgan";

const app = express();


app.use(morgan("dev"));

app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN,
      "http://localhost:5173",
      "http://localhost:3000",
      "http://localhost:8081", // React Native Web
      "http://localhost:8082", // React Native Web Alternate Port
      "http://10.0.2.2:8081", // Android Emulator
      "http://10.2.1.9:8081", // Physical Device Testing
    ],
    credentials: true,
  })
);


app.use(
  express.json({
    limit: "16kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // make sure folder name matches
app.use(cookieParser());

import authRoutes from "./routes/auth.routes.js";
import workerRoutes from "./routes/workers.routes.js";
import ownerRoutes from "./routes/owners.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import siteRoutes from "./routes/sites.routes.js";


import rateRoutes from "./routes/rate.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/rates", rateRoutes);
app.use("/api/subscription", subscriptionRoutes);


import ApiError from "./utils/ApiError.js";

// Error middleware
app.use((err, req, res, next) => {
  const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.url} - ${err.statusCode || 500} - ${err.message}\n`;
  console.error("API ERROR:", logMsg);
  try { fs.appendFileSync("backend_errors.log", logMsg); } catch(e) { console.error("Logger fail", e); }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: err.success,
      message: err.message,
      errors: err.errors,
    });
  }

  // Handle other errors
  return res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;

