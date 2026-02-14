import express from "express";
import {
  getPendingWorkers,
  approveWorker,
  deactivateWorker,
  assignAdminRole,
  removeAdminRole,
  createRate,
  getActiveRates,
  getAllWorkers,
  getOwnerDashboard,
} from "../controllers/owners.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyJWT, isOwner);

router.get("/pending-workers", getPendingWorkers);
router.get("/workers", getAllWorkers);
router.get("/dashboard", getOwnerDashboard);

router.patch("/approve/:workerId", approveWorker);
router.patch("/deactivate/:workerId", deactivateWorker);

router.patch("/assign-admin/:workerId", assignAdminRole);
router.patch("/remove-admin/:workerId", removeAdminRole);

router.post("/rates", createRate);
router.get("/rates", getActiveRates);

export default router;
