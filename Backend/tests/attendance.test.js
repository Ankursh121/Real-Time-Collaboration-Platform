import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/users.models.js";
import Site from "../src/models/site.models.js";
import { UserRoles, UserStatus } from "../src/constants/user.constants.js";
import jwt from "jsonwebtoken";

describe("Attendance Endpoints", () => {
  let ownerToken;
  let ownerId;
  let workerId;
  let siteId;

  beforeEach(async () => {
    // 1. Create Owner
    const owner = await User.create({
      phone: "0000000001",
      name: "Owner 1",
      role: UserRoles.OWNER,
      status: UserStatus.ACTIVE,
      gender: "Male"
    });
    ownerId = owner._id;

    // 2. Generate manual token for speed
    ownerToken = jwt.sign({ userId: ownerId, role: UserRoles.OWNER }, process.env.ACCESS_TOKEN_SECRET);

    // 3. Create Site
    const site = await Site.create({
      ownerId,
      name: "Test Site",
      location: "Bhopal"
    });
    siteId = site._id;

    // 4. Create Worker belonging to this owner
    const worker = await User.create({
      phone: "9000000001",
      name: "Worker 1",
      role: UserRoles.WORKER,
      status: UserStatus.ACTIVE,
      ownerId,
      gender: "Male"
    });
    workerId = worker._id;
  });

  describe("POST /api/attendance/mark", () => {
    it("should mark attendance successfully by owner", async () => {
      const res = await request(app)
        .post("/api/attendance/mark")
        .set("Cookie", [`accessToken=${ownerToken}`])
        .send({
          workerId,
          siteId,
          hoursWorked: 8,
          overtimeHours: 2,
          date: new Date().toISOString()
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hoursWorked).toBe(8);
      expect(res.body.data.overtimeHours).toBe(2);
    });

    it("should fail if worker belongs to another owner", async () => {
      // Create another owner
      const stranger = await User.create({
        phone: "0000000002",
        name: "Stranger",
        role: UserRoles.OWNER,
        status: UserStatus.ACTIVE,
        gender: "Male"
      });
      const strangerToken = jwt.sign({ userId: stranger._id, role: UserRoles.OWNER }, process.env.ACCESS_TOKEN_SECRET);

      const res = await request(app)
        .post("/api/attendance/mark")
        .set("Cookie", [`accessToken=${strangerToken}`])
        .send({
          workerId,
          siteId,
          hoursWorked: 8,
          date: new Date().toISOString()
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain("This worker does not belong to you");
    });
  });
});
