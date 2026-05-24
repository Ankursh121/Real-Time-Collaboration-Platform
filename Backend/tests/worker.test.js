import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/users.models.js";
import { UserRoles, UserStatus } from "../src/constants/user.constants.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Worker Endpoints", () => {
  let ownerToken;
  let inviteCode;

  beforeEach(async () => {
    // Setup an owner
    const owner = await User.create({
      phone: "1112223333",
      name: "Owner User",
      role: UserRoles.OWNER,
      status: UserStatus.ACTIVE,
      gender: "Male",
      inviteCode: "OWNER123"
    });
    inviteCode = owner.inviteCode;

    const res = await request(app)
      .post("/api/auth/send-otp")
      .send({ phone: "1112223333" });
    
    const userWithOtp = await User.findOne({ phone: "1112223333" }).select("+OTP");
    
    const loginRes = await request(app)
      .post("/api/auth/verify-otp")
      .send({ phone: "1112223333", otp: userWithOtp.OTP });
    
    ownerToken = loginRes.header["set-cookie"][0].split(";")[0].split("=")[1];
  });

  describe("POST /api/workers/register", () => {
    it("should fail registration without photo", async () => {
      const res = await request(app)
        .post("/api/workers/register")
        .field("name", "New Worker")
        .field("phone", "4445556666")
        .field("gender", "Male")
        .field("workerType", "Labour")
        .field("password", "password123")
        .field("inviteCode", inviteCode);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe("Worker photo is required");
    });
  });
});
