import mongoose from "mongoose";
import dotenv from "dotenv";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log(
      `MongoDB connected !! DB host : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;

