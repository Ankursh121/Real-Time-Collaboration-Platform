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
  requestSiteDelete,
  confirmSiteDelete,
} from "../controllers/site.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyJWT, isOwner);

router.post("/", createSite);
router.get("/", getSites);
router.get("/stats/:siteId", getSiteStats);
router.get("/:siteId", getSingleSite);
router.patch("/deactivate/:siteId", deactivateSite);
router.patch("/assign-worker/:siteId", assignWorkerToSite);
router.patch("/remove-worker/:siteId", removeWorkerFromSite);
router.patch("/:siteId", updateSite);
router.post("/request-delete/:siteId", requestSiteDelete);
router.delete("/confirm-delete/:siteId", confirmSiteDelete);

export default router;
