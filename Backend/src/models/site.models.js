import mongoose from "mongoose";

const siteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // contractor who owns this site
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    startDate: {
      type: Date,
      default: Date.now,
    },

    endDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

/**
 * Prevent duplicate site names per contractor
 */
siteSchema.index(
  { ownerId: 1, name: 1 },
  { unique: true }
);

const Site = mongoose.model("Site", siteSchema);

export default Site;
