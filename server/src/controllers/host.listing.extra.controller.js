/**
 * Host Listing Extra Controller — Advanced listing management stubs
 * Pricing, promotions, calendar, co-hosts, etc.
 */
import { query } from "../config/db.js";

export const updatePricing = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id } = req.params;
    const { price_per_night, cleaning_fee, weekly_discount, monthly_discount } = req.body;

    const result = await query(
      `UPDATE listings SET
         price_per_night = COALESCE($3, price_per_night),
         cleaning_fee = COALESCE($4, cleaning_fee),
         weekly_discount = COALESCE($5, weekly_discount),
         monthly_discount = COALESCE($6, monthly_discount),
         updated_at = NOW()
       WHERE id = $1 AND host_id = $2
       RETURNING id, price_per_night, cleaning_fee`,
      [id, hostId, price_per_night, cleaning_fee, weekly_discount, monthly_discount]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Listing not found or unauthorized" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stub implementations for future features
const stub = (name) => async (_req, res) => {
  res.status(501).json({ success: false, message: `${name} is not yet implemented.` });
};

export const createPromotion = stub("Create promotion");
export const getPromotions = async (_req, res) => res.json({ success: true, data: [] });
export const deletePromotion = stub("Delete promotion");
export const setSeasonalPricing = stub("Seasonal pricing");
export const setCancellationPolicy = stub("Cancellation policy");
export const setHouseRules = stub("House rules");
export const getCalendar = async (_req, res) => res.json({ success: true, data: { blocked_dates: [] } });
export const blockDates = stub("Block dates");
export const unblockDates = stub("Unblock dates");
export const syncIcal = stub("iCal sync");
export const exportIcal = stub("iCal export");
export const inviteCohost = stub("Invite co-host");
export const getCohosts = async (_req, res) => res.json({ success: true, data: [] });
export const updateCohost = stub("Update co-host");
export const removeCohost = stub("Remove co-host");
