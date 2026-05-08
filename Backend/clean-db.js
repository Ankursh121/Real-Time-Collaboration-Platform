import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/users.models.js";
import Site from "./src/models/site.models.js";
import Attendance from "./src/models/attendance.models.js";
import Payment from "./src/models/payment.models.js";
import Rate from "./src/models/rate.models.js";

dotenv.config();

const cleanDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB...");

    await User.deleteMany({});
    console.log("Cleared Users collection");

    // Clear others if they exist, wrapping in try/catch in case models don't exist
    try { await Site.deleteMany({}); console.log("Cleared Sites"); } catch (e) {}
    try { await Attendance.deleteMany({}); console.log("Cleared Attendance"); } catch (e) {}
    try { await Payment.deleteMany({}); console.log("Cleared Payments"); } catch (e) {}
    try { await Rate.deleteMany({}); console.log("Cleared Rates"); } catch (e) {}

    console.log("Database successfully cleaned!");
    process.exit(0);
  } catch (error) {
    console.error("Error cleaning database:", error);
    process.exit(1);
  }
};

cleanDB();
