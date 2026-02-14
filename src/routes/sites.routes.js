import express from "express";
import {
  createSite,
  getSites,
  getSingleSite,
  updateSite,
  deactivateSite,
  assignWorkerToSite,
} from "../controllers/site.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyJWT, isOwner);

router.post("/", createSite);
router.get("/", getSites);
router.get("/:siteId", getSingleSite);
router.patch("/:siteId", updateSite);
router.patch("/deactivate/:siteId", deactivateSite);
router.patch("/assign-worker/:siteId", assignWorkerToSite);

export default router;
