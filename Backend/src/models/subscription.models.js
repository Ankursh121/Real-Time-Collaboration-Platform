import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ["free", "basic", "pro", "advanced"],
      default: "free",
    },
    status: {
      type: String,
      enum: ["trial", "active", "expired", "cancelled", "pending"],
      default: "active",
    },
    workerLimit: {
      type: Number,
      default: 10,
    },
    amount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    razorpayCustomerId: {
      type: String,
    },
    razorpaySubscriptionId: {
      type: String,
    },
    razorpayPlanId: {
      type: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    paymentHistory: [
      {
        paymentId: String,
        amount: Number,
        status: String,
        paidAt: Date,
        invoiceUrl: String,
      },
    ],
  },
  { timestamps: true }
);

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
