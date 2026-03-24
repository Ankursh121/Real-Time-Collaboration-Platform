import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";


dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
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


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Labour & Worksite Management API is running",
  });
});

export default app;

