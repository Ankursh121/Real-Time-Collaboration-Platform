import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/users.models.js";
import Site from "../src/models/site.models.js";
import Rate from "../src/models/rate.models.js";
import Attendance from "../src/models/attendance.models.js";
import { UserRoles, UserStatus } from "../src/constants/user.constants.js";
import jwt from "jsonwebtoken";

describe("Payment Endpoints", () => {
  let ownerToken;
  let ownerId;
  let workerId;
  let siteId;

  beforeEach(async () => {
    // 1. Setup Owner
    const owner = await User.create({
      phone: "0000000003",
      name: "Owner 3",
      role: UserRoles.OWNER,
      status: UserStatus.ACTIVE,
      gender: "Male"
    });
    ownerId = owner._id;
    ownerToken = jwt.sign({ userId: ownerId, role: UserRoles.OWNER }, process.env.ACCESS_TOKEN_SECRET);

    // 2. Setup Site
    const site = await Site.create({
      ownerId,
      name: "Payment Test Site",
      location: "Indore"
    });
    siteId = site._id;

    // 3. Setup Worker
    const worker = await User.create({
      phone: "9000000003",
      name: "Worker 3",
      role: UserRoles.WORKER,
      status: UserStatus.ACTIVE,
      ownerId,
      workerType: "Labour",
      gender: "Male"
    });
    workerId = worker._id;

    // 4. Setup Rate
    await Rate.create({
      ownerId,
      siteId,
      workerType: "Labour",
      dailyRate: 500,
      overtimeRatePerHour: 100,
      isActive: true
    });

    // 5. Mark Attendance
    await Attendance.create({
      ownerId,
      siteId,
      workerId,
      date: new Date("2024-01-01"),
      hoursWorked: 8,
      overtimeHours: 2,
      markedBy: ownerId
    });
  });

  describe("POST /api/payments/generate", () => {
    it("should generate payment correctly", async () => {
      // 8 hrs = 500 (daily rate)
      // 2 hrs OT = 2 * 100 = 200
      // Total = 700

      const res = await request(app)
        .post("/api/payments/generate")
        .set("Cookie", [`accessToken=${ownerToken}`])
        .send({
          workerId,
          siteId,
          periodStart: "2024-01-01",
          periodEnd: "2024-01-01"
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.totalAmount).toBe(700);
      expect(res.body.data.status).toBe("Pending");
    });
  });
});
