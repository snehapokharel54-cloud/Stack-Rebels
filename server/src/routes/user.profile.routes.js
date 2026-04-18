import { Router } from "express";
import { getMyProfile, updateMyProfile, getPublicHostProfile } from "../controllers/user.profile.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.get("/me", authenticate, getMyProfile);
router.patch("/me", authenticate, updateMyProfile);
router.get("/hosts/:id/profile", getPublicHostProfile);

export default router;
      