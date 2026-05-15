import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { createDispute, getDisputeMessages, sendDisputeMessage } from "../controllers/dispute.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * POST /v1/disputes
 * Create a new dispute (Guest)
 */
router.post("/", createDispute);

/**
 * GET /v1/disputes/:id/messages
 * Get messages in a dispute conversation (id is conversation_id)
 */
router.get("/:id/messages", getDisputeMessages);

/**
 * POST /v1/disputes/:id/messages
 * Send a message in a dispute conversation (id is conversation_id)
 */
router.post("/:id/messages", sendDisputeMessage);

export default router;
