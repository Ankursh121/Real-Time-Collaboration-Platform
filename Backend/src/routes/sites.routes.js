import express from "express";
import {
  createSite,
  getSites,
  getSingleSite,
  updateSite,
  deactivateSite,
  assignWorkerToSite,
  removeWorkerFromSite,
  getSiteStats,
  confirmSiteDelete,
  generateSiteReport,
  getSiteReportData,
} from "../controllers/site.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner, isAdminOrOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyJWT);

router.post("/", isOwner, createSite);
router.get("/", isAdminOrOwner, getSites);
router.get("/stats/:siteId", isAdminOrOwner, getSiteStats);
router.get("/report/:siteId", isOwner, generateSiteReport);
router.get("/report-data/:siteId", isOwner, getSiteReportData);
router.get("/:siteId", isAdminOrOwner, getSingleSite);
router.patch("/deactivate/:siteId", isOwner, deactivateSite);
router.patch("/assign-worker/:siteId", isOwner, assignWorkerToSite);
router.patch("/remove-worker/:siteId", isOwner, removeWorkerFromSite);
router.patch("/:siteId", isOwner, updateSite);
router.delete("/confirm-delete/:siteId", isOwner, confirmSiteDelete);

export default router;
