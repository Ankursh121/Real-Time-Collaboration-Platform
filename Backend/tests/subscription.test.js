import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/users.models.js";
import Subscription from "../src/models/subscription.models.js";
import { UserRoles, UserStatus } from "../src/constants/user.constants.js";
import jwt from "jsonwebtoken";

describe("Subscription Coupon Endpoints", () => {
  let ownerToken;
  let ownerId;

  beforeEach(async () => {
    // Clean subscriptions
    await Subscription.deleteMany({});

    // Setup Owner
    const owner = await User.create({
      phone: "0000000005",
      name: "Owner 5",
      role: UserRoles.OWNER,
      status: UserStatus.ACTIVE,
      gender: "Male"
    });
    ownerId = owner._id;
    ownerToken = jwt.sign({ userId: ownerId, role: UserRoles.OWNER }, process.env.ACCESS_TOKEN_SECRET);
  });

  describe("POST /api/subscription/apply-coupon", () => {
    it("should reject when couponCode is missing", async () => {
      const res = await request(app)
        .post("/api/subscription/apply-coupon")
        .set("Cookie", [`accessToken=${ownerToken}`])
        .send({});

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain("Coupon code is required");
    });

    it("should reject when couponCode is invalid", async () => {
      const res = await request(app)
        .post("/api/subscription/apply-coupon")
        .set("Cookie", [`accessToken=${ownerToken}`])
        .send({ couponCode: "WRONG77" });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain("Invalid coupon code");
    });

    it("should activate advanced plan with valid NIRVESH77 coupon (case-insensitive)", async () => {
      const res = await request(app)
        .post("/api/subscription/apply-coupon")
        .set("Cookie", [`accessToken=${ownerToken}`])
        .send({ couponCode: "  nirvesh77  " });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain("Coupon applied successfully! Advanced plan activated.");

      // Check database update
      const sub = await Subscription.findOne({ ownerId });
      expect(sub).toBeDefined();
      expect(sub.plan).toBe("advanced");
      expect(sub.status).toBe("active");
      expect(sub.workerLimit).toBe(1000000); // 1 Million / Unlimited
      expect(sub.razorpaySubscriptionId).toBe("COUPON_NIRVESH77");
      expect(sub.paymentHistory.length).toBe(1);
      expect(sub.paymentHistory[0].amount).toBe(0);
      expect(sub.paymentHistory[0].paymentId).toContain("COUPON_NIRVESH77");
    });
  });
});
