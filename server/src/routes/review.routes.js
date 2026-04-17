
import { Router } from "express";
import { createReview, getListingReviews, getReceivedReviews, replyToReview, rateGuest } from "../controllers/review.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.post("/", verifyUser, createReview);
router.get("/listings/:id", getListingReviews);
router.get("/received", verifyUser, getReceivedReviews);
router.post("/:id/reply", verifyUser, replyToReview);
router.post("/guest", verifyUser, rateGuest);

export default router;
      