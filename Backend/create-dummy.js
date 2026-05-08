import mongoose from "mongoose";
import User from "./src/models/users.models.js";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");

  const existing = await User.findOne({ phone: "1234567890" });
  if (!existing) {
    await User.create({
      name: "Dummy Owner",
      phone: "1234567890",
      role: "Owner",
      gender: "Male",
      status: "Active",
      inviteCode: "DUMMY123",
    });
    console.log("Created dummy OWNER with phone 1234567890");
  } else {
    console.log("Dummy owner already exists");
  }

  process.exit(0);
};

run();
