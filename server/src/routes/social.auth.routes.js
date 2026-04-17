
import { Router } from "express";
import { googleLogin, facebookLogin, appleLogin } from "../controllers/social.auth.controller.js";

const router = Router();
router.post("/google", googleLogin);
router.post("/facebook", facebookLogin);
router.post("/apple", appleLogin);

export default router;
      