
import { Router } from "express";
import { createBooking, getGuestBookings, getBookingDetails, cancelGuestBooking, getBookingPriceBreakdown, getIncomingRequests, acceptBooking, declineBooking, cancelHostBooking } from "../controllers/booking.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.post("/", verifyUser, createBooking);
router.get("/", verifyUser, getGuestBookings);
router.get("/host/incoming", verifyUser, getIncomingRequests);
router.get("/:id", verifyUser, getBookingDetails);
router.patch("/:id/cancel", verifyUser, cancelGuestBooking);
router.get("/:id/price-breakdown", verifyUser, getBookingPriceBreakdown);
router.patch("/:id/accept", verifyUser, acceptBooking);
router.patch("/:id/decline", verifyUser, declineBooking);
router.patch("/:id/host-cancel", verifyUser, cancelHostBooking);

export default router;
      