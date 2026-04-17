
import { Router } from "express";
import { getMyProfile, updateMyProfile, getPublicHostProfile } from "../controllers/user.profile.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.get("/me", verifyUser, getMyProfile);
router.patch("/me", verifyUser, updateMyProfile);
router.get("/hosts/:id/profile", getPublicHostProfile);

export default router;
      