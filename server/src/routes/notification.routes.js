
import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.use(verifyUser);
router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;
      