import express from "express";
import { 
    createRate, 
    getRates,
    getActiveRatesForSite,
    deleteRate
} from "../controllers/rate.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { isOwner } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyJWT, isOwner);

router.post("/set", createRate);
router.get("/", getRates);
router.get("/site/:siteId", getActiveRatesForSite);
router.delete("/:rateId", deleteRate);

export default router;
