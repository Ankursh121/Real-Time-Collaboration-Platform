import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/users.models.js";

dotenv.config();

const fixUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Convert 1234567890 to Owner DUMMY123
    await User.findOneAndUpdate(
        { phone: "1234567890" },
        { 
            role: "Owner", 
            inviteCode: "DUMMY123", 
            status: "Active",
            name: "Dummy Owner"
        },
        { upsert: true }
    );
    
    console.log("Successfully fixed 1234567890 to be Owner DUMMY123");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixUser();
