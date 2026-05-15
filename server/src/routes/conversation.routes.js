import { Router } from "express";
import {
  startConversation,
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/conversation.controller.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();
router.use(authenticate);
router.post("/", startConversation);
router.get("/", getConversations);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", sendMessage);

export default router;
