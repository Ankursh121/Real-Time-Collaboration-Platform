import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/users.models.js";
import { UserRoles } from "../src/constants/user.constants.js";

describe("Auth Endpoints", () => {
  describe("POST /api/auth/send-otp", () => {
    it("should send OTP successfully", async () => {
      const res = await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "1234567890" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("OTP sent successfully");

      const user = await User.findOne({ phone: "1234567890" }).select("+OTP");
      expect(user).toBeDefined();
      expect(user.OTP).toBeDefined();
    });
  });

  describe("POST /api/auth/verify-otp", () => {
    it("should verify OTP and register Owner", async () => {
      // First send OTP
      await request(app)
        .post("/api/auth/send-otp")
        .send({ phone: "9876543210" });
      
      const userBefore = await User.findOne({ phone: "9876543210" }).select("+OTP");
      const otp = userBefore.OTP;

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          phone: "9876543210",
          otp,
          name: "Test Owner",
          role: UserRoles.OWNER
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data.user.role).toBe(UserRoles.OWNER);
      expect(res.body.data.user.inviteCode).toBeDefined();
    });

    it("should fail with invalid OTP", async () => {
        await request(app)
          .post("/api/auth/send-otp")
          .send({ phone: "1112223334" });

        const res = await request(app)
          .post("/api/auth/verify-otp")
          .send({
            phone: "1112223334",
            otp: "000000",
            name: "Fail User"
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toBe("Invalid OTP");
    });
  });
});
