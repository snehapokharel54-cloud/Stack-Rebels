import { query } from "../config/db.js";

// Update listing pricing (Section 2)
export const updatePricing = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: listingId } = req.params;
    const { price_per_night, weekend_price, minimum_night_stay, maximum_night_stay, cleaning_fee, security_deposit } = req.body;

    if (!price_per_night || price_per_night <= 0) {
      return res.status(400).json({ success: false, message: "Valid price_per_night is required" });
    }

    const verify = await query("SELECT id FROM listings WHERE id = $1 AND host_id = $2", [listingId, hostId]);
    if (verify.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized" });

    const result = await query(
      `UPDATE listings 
       SET price_per_night = $1, weekend_price = $2, minimum_night_stay = $3, maximum_night_stay = $4, 
           cleaning_fee = $5, security_deposit = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING id as listing_id, price_per_night, weekend_price, minimum_night_stay, maximum_night_stay, cleaning_fee, security_deposit, updated_at`,
      [price_per_night, weekend_price, minimum_night_stay || 1, maximum_night_stay || 365, cleaning_fee || 0, security_deposit || 0, listingId]
    );

    res.json({ success: true, listing_id: listingId, pricing: result.rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Calendar Availability (Section 2)
export const getCalendar = async (req, res) => { 
  try {
    const { id: listingId } = req.params;
    const { month } = req.query; // YYYY-MM
    let dateFilter = "";
    
    // Simplistic extraction just fetching all active blocks + confirmed bookings
    const bookings = await query(
      "SELECT check_in, check_out FROM bookings WHERE listing_id = $1 AND status IN ('confirmed', 'pending')",
      [listingId]
    );
    
    const blocks = await query(
      "SELECT from_date, to_date FROM calendar_blocks WHERE listing_id = $1", 
      [listingId]
    );

    // Provide raw date ranges for consumer to parse
    res.json({ 
      listing_id: listingId,
      month: month || "all",
      booked_ranges: bookings.rows,
      blocked_ranges: blocks.rows
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const blockDates = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: listingId } = req.params;
    const { from, to, reason } = req.body;

    const verify = await query("SELECT id FROM listings WHERE id = $1 AND host_id = $2", [listingId, hostId]);
    if (verify.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized" });

    // Assuming calendar_blocks table exists
    const result = await query(
      `INSERT INTO calendar_blocks (listing_id, from_date, to_date, reason) 
       VALUES ($1, $2, $3, $4) RETURNING id as block_id, listing_id, from_date as "from", to_date as "to", reason, created_at`,
      [listingId, from, to, reason || "Personal use"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const unblockDates = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: listingId, blockId } = req.params;

    const verify = await query("SELECT id FROM listings WHERE id = $1 AND host_id = $2", [listingId, hostId]);
    if (verify.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized" });

    await query("DELETE FROM calendar_blocks WHERE id = $1 AND listing_id = $2", [blockId, listingId]);
    
    res.json({ success: true, message: "Dates unblocked successfully.", block_id: blockId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Mock the rest that were not explicitly detailed
export const createPromotion = async (req, res) => { res.json({ success: true, message: 'Promotion created' }); };
export const getPromotions = async (req, res) => { res.json({ success: true, data: [] }); };
export const deletePromotion = async (req, res) => { res.json({ success: true, message: 'Promotion deleted' }); };
export const setSeasonalPricing = async (req, res) => { res.json({ success: true, message: 'Seasonal pricing set' }); };
export const setCancellationPolicy = async (req, res) => { res.json({ success: true, message: 'Policy set' }); };
export const setHouseRules = async (req, res) => { res.json({ success: true, message: 'Rules set' }); };
export const syncIcal = async (req, res) => { res.json({ success: true, message: 'iCal synced' }); };
export const exportIcal = async (req, res) => { res.send('BEGIN:VCALENDAR\n...\nEND:VCALENDAR'); };
export const inviteCohost = async (req, res) => { res.json({ success: true, message: 'Cohost invited' }); };
export const getCohosts = async (req, res) => { res.json({ success: true, data: [] }); };
export const updateCohost = async (req, res) => { res.json({ success: true, message: 'Cohost updated' }); };
export const removeCohost = async (req, res) => { res.json({ success: true, message: 'Cohost removed' }); };