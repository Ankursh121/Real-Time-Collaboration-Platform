import mongoose from "mongoose";

const rateSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, 
    },

    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      default: null,
    },

    workerType: {
      type: String,
      enum: [
        "Labour",
        "Mistri",
        "Satring-Labour",
        "Satring-Mistri",
      ],
      required: true,
    },

    dailyRate: {
      type: Number,
      required: true,
      min: 0,
    },

    overtimeRatePerHour: {
      type: Number,
      required: true,
      min: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    effectiveFrom: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

 // Prevent duplicate active rates
 // One active rate per owner + site + workerType

rateSchema.index(
  { ownerId: 1, siteId: 1, workerType: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } }
);

const Rate = mongoose.model("Rate", rateSchema);
export default Rate;
