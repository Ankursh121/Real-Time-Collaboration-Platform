import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";


dotenv.config();

import morgan from "morgan";

const app = express();


app.use(morgan("dev"));

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN, "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);


app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public")); // make sure folder name matches
app.use(cookieParser());

import authRoutes from "./routes/auth.routes.js";
import workerRoutes from "./routes/workers.routes.js";
import ownerRoutes from "./routes/owners.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import siteRoutes from "./routes/sites.routes.js";


app.use("/api/auth", authRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/owners", ownerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/sites", siteRoutes);


import ApiError from "./utils/ApiError.js";

// Error middleware
app.use((err, req, res, next) => {
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

