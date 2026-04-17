import { Router } from "express";
import { verifyHost } from "../middlewares/authenticate.js";
import {
  getIncomingBookings,
  getBookingHistory,
  confirmBooking,
  declineBooking,
  cancelConfirmedBooking
} from "../controllers/host.booking.controller.js";

const router = Router();

// All routes require host authentication
router.use(verifyHost);

router.get("/incoming", getIncomingBookings);
router.get("/history", getBookingHistory);
router.post("/:id/confirm", confirmBooking);
router.post("/:id/decline", declineBooking);
router.post("/:id/cancel", cancelConfirmedBooking);

export default router;
