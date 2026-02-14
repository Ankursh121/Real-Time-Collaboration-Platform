import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },

    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
    },

    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    hoursWorked: {
      type: Number,
      required: true,
      min: 0,
      max: 24,
    },

    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
      max: 16,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },

    remark: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

 // Ensure one attendance per worker per day per site

attendanceSchema.index(
  { workerId: 1, siteId: 1, date: 1 },
  { unique: true }
);

const Attendance = mongoose.model("Attendance", attendanceSchema);

export default Attendance;
