import mongoose from "mongoose";
import app from "../src/app.js";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB connected for Vercel Serverless");
  } catch (error) {
    console.error("MongoDB connection failed in Vercel:", error.message);
    throw error;
  }
};

const handler = async (req, res) => {
  await connectDB();
  return app(req, res);
};

export default handler;
