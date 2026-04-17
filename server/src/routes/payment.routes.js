
import { Router } from "express";
import express from "express";
import { initiatePayment, verifyPayment, getPaymentHistory, stripeWebhook } from "../controllers/payment.controller.js";
import { initiateKhaltiPayment, verifyKhaltiPayment } from "../controllers/khalti.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();

// Stripe webhook — MUST use raw body (not JSON parsed)
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook);

// Authenticated payment endpoints
router.post("/create-intent", verifyUser, initiatePayment);
router.post("/verify", verifyUser, verifyPayment);
router.get("/history", verifyUser, getPaymentHistory);

router.post("/khalti/create-intent", verifyUser, initiateKhaltiPayment);
router.post("/khalti/verify", verifyUser, verifyKhaltiPayment);

export default router;