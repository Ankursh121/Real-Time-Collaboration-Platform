import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/users.models.js";

dotenv.config();

const listOwners = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const owners = await User.find({ role: "Owner" });
    console.log("Owners found:", owners.map(o => ({ phone: o.phone, inviteCode: o.inviteCode })));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listOwners();
