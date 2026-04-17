import { Router } from "express";
import { verifyHost } from "../middlewares/authenticate.js";
import {
  getReceivedReviews,
  replyToReview,
  rateGuest
} from "../controllers/host.review.controller.js";

const router = Router();

// All routes require host authentication
router.use(verifyHost);

router.get("/received", getReceivedReviews);
router.post("/:id/reply", replyToReview);
router.post("/rate-guest", rateGuest);

export default router;
