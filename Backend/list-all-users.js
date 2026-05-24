import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/users.models.js";

dotenv.config();

const listAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log("All users:", users.map(u => ({ phone: u.phone, role: u.role, inviteCode: u.inviteCode, status: u.status })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listAllUsers();
