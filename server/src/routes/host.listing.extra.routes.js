
import { Router } from "express";
import { updatePricing, createPromotion, getPromotions, deletePromotion, setSeasonalPricing, setCancellationPolicy, setHouseRules, getCalendar, blockDates, unblockDates, syncIcal, exportIcal, inviteCohost, getCohosts, updateCohost, removeCohost } from "../controllers/host.listing.extra.controller.js";
import { verifyUser } from "../middlewares/authenticate.js";

const router = Router();
router.use(verifyUser);
router.patch("/:id/pricing", updatePricing);
router.post("/:id/promotions", createPromotion);
router.get("/:id/promotions", getPromotions);
router.delete("/:id/promotions/:promoId", deletePromotion);
router.post("/:id/seasonal-pricing", setSeasonalPricing);
router.patch("/:id/cancellation-policy", setCancellationPolicy);
router.patch("/:id/house-rules", setHouseRules);
router.get("/:id/calendar", getCalendar);
router.post("/:id/availability/block", blockDates);
router.delete("/:id/availability/block/:blockId", unblockDates);
router.post("/:id/ical/sync", syncIcal);
router.get("/:id/ical/export", exportIcal);
router.post("/:id/cohosts", inviteCohost);
router.get("/:id/cohosts", getCohosts);
router.patch("/:id/cohosts/:cohostId", updateCohost);
router.delete("/:id/cohosts/:cohostId", removeCohost);

export default router;
      