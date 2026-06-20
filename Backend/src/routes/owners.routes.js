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
  getUniversalDashboard,
  updateWorkerProfile,
  deleteUser,
  addFamilyMember,
} from "../controllers/owners.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner, isAdminOrOwner } from "../middlewares/role.middleware.js";

import { checkWorkerLimit } from "../middlewares/subscription.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.get("/pending-workers", isOwner, getPendingWorkers);
router.get("/workers", isAdminOrOwner, getAllWorkers);
router.get("/dashboard", isAdminOrOwner, getUniversalDashboard);

router.patch("/approve/:workerId", isOwner, checkWorkerLimit, approveWorker);
router.patch("/deactivate/:workerId", isOwner, deactivateWorker);

router.patch("/assign-admin/:workerId", isOwner, assignAdminRole);
router.patch("/remove-admin/:workerId", isOwner, removeAdminRole);
router.patch("/update-profile/:workerId", isOwner, updateWorkerProfile);
router.delete("/delete/:userId", isOwner, deleteUser);

router.post("/workers/:parentWorkerId/family", isOwner, addFamilyMember);

router.post("/rates", isOwner, createRate);
router.get("/rates", isOwner, getActiveRates);

export default router;
