import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/users.models.js";
import { UserRoles } from "../src/constants/user.constants.js";
import jwt from "jsonwebtoken";

const generateMockFirebaseToken = (email, uid, name) => {
  const projectId = process.env.FIREBASE_PROJECT_ID || "worksitepro-placeholder";
  return jwt.sign(
    {
      iss: `https://securetoken.google.com/${projectId}`,
      aud: projectId,
      exp: Math.floor(Date.now() / 1000) + 300,
      email,
      sub: uid,
      name,
    },
    "dummy-secret"
  );
};

describe("Auth Endpoints", () => {
  describe("POST /api/auth/verify-otp", () => {
    it("should register Owner successfully using a Google ID token", async () => {
      const firebaseToken = generateMockFirebaseToken("owner@example.com", "uid123", "Test Owner");
      
      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          firebaseToken,
          phone: "9876543210",
          name: "Test Owner",
          role: UserRoles.OWNER
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data.user.role).toBe(UserRoles.OWNER);
      expect(res.body.data.user.inviteCode).toBeDefined();

      const user = await User.findOne({ email: "owner@example.com" });
      expect(user).toBeTruthy();
      expect(user.phone).toBe("9876543210");
    });

    it("should login registered user successfully", async () => {
      await User.create({
        email: "owner2@example.com",
        firebaseUid: "uid123_2",
        phone: "9876543211",
        name: "Test Owner 2",
        role: UserRoles.OWNER,
        status: "Active",
        gender: "Others"
      });

      const firebaseToken = generateMockFirebaseToken("owner2@example.com", "uid123_2", "Test Owner 2");

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          firebaseToken
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Login successful");
    });

    it("should fail with invalid/expired token issuer", async () => {
      const badToken = jwt.sign(
        {
          iss: "https://bad-issuer.com",
          aud: "worksitepro-placeholder",
          exp: Math.floor(Date.now() / 1000) + 300,
          email: "bad@example.com",
          sub: "baduid",
        },
        "dummy"
      );

      const res = await request(app)
        .post("/api/auth/verify-otp")
        .send({
          firebaseToken: badToken,
          phone: "1111111111",
          role: UserRoles.OWNER
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain("Token issuer mismatch");
    });
  });
});
