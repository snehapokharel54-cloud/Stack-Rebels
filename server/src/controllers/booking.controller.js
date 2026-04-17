import { query } from "../config/db.js";
import { 
  sendBookingConfirmationEmail, 
  sendGuestCancellationEmailToHost, 
  sendGuestCancellationEmailToGuest 
} from "../utils/mailer.js";


export const createBooking = async (req, res) => { 
  try {
    const guestId = req.user.sub;
    const { listing_id, check_in, check_out, guests, booking_type, special_requests } = req.body;

    // 1. Fetch listing details to ensure it's available and get pricing
    const listingQuery = await query(
      "SELECT host_id, price_per_night, cleaning_fee, status, instant_book_enabled FROM listings WHERE id = $1",
      [listing_id]
    );

    if (listingQuery.rows.length === 0) return res.status(404).json({ success: false, message: "Listing not found" });
    const listing = listingQuery.rows[0];

    if (listing.status !== 'PUBLISHED') return res.status(400).json({ success: false, message: "Listing is not available" });
    if (booking_type === 'instant' && !listing.instant_book_enabled) return res.status(400).json({ success: false, message: "Instant booking not allowed" });
    if (listing.host_id === guestId) return res.status(400).json({ success: false, message: "Cannot book your own listing!" });

    // 2. Check overlapping dates
    const overlapCheck = await query(
      `SELECT id FROM bookings 
       WHERE listing_id = $1 AND status IN ('PENDING', 'CONFIRMED') 
       AND (check_in < $3 AND check_out > $2)`,
      [listing_id, check_in, check_out]
    );

    if (overlapCheck.rows.length > 0) return res.status(409).json({ success: false, message: "Dates are already booked" });

    // Math calculation (Simplified, using JS Dates for nights)
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    if (nights < 1) return res.status(400).json({ success: false, message: "Check-out must be after check-in" });

    const pricePerNight = Number(listing.price_per_night) || 0;
    const base_price = Number(nights * pricePerNight);
    const cleaning_fee = Number(listing.cleaning_fee) || 0;
    const platform_service_fee = Math.round(base_price * 0.1); 
    const tax = Math.round((base_price + cleaning_fee + platform_service_fee) * 0.13); // 13% VAT
    const total = Math.round(base_price + cleaning_fee + platform_service_fee + tax);

    const price_breakdown = JSON.stringify({
      base_price,
      cleaning_fee,
      platform_service_fee,
      discount_applied: 0,
      tax,
      total
    });

    const initStatus = booking_type === 'instant' ? 'PENDING' : 'PENDING'; // In this demo, wait for payment
    
    const result = await query(
      `INSERT INTO bookings (listing_id, host_id, guest_id, check_in, check_out, nights, status, booking_type, price_breakdown, payment_status, special_requests, num_guests, price_per_night, total_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'unpaid', $10, $11, $12, $13)
       RETURNING id as booking_id, listing_id, host_id, guest_id, check_in, check_out, nights, status, booking_type, price_breakdown, payment_status, created_at`,
      [listing_id, listing.host_id, guestId, check_in, check_out, nights, initStatus, booking_type, price_breakdown, special_requests, guests, pricePerNight, total]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getGuestBookings = async (req, res) => { 
  try {
    const guestId = req.user.sub;
    const { status, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT b.id as booking_id, l.title as listing_title, l.photos->0->>'url' as listing_photo,
               u.full_name as host_name, b.check_in, b.check_out, b.nights, 
               (b.price_breakdown->>'total')::int as total, b.status, b.payment_status,
               p.gateway, p.khalti_pidx
               FROM bookings b
               JOIN listings l ON b.listing_id = l.id
               JOIN users u ON b.host_id = u.id
               LEFT JOIN payments p ON b.id = p.booking_id
               WHERE b.guest_id = $1`;
    let params = [guestId];

    if (status) {
      params.push(status);
      sql += ` AND b.status = $2`;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    
    // Agg paginaton
    const totalCount = await query(`SELECT COUNT(*) FROM bookings WHERE guest_id = $1`, [guestId]);

    res.json({ 
      success: true, 
      data: result.rows,
      pagination: { total: parseInt(totalCount.rows[0].count), limit, offset }
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getBookingDetails = async (req, res) => { 
  try {
    const { id: bookingId } = req.params;
    const userId = req.user.sub; // Ensure reader is host or guest
    
    const result = await query(
      `SELECT b.id as booking_id, 
              json_build_object('id', l.id, 'title', l.title, 'photos', ARRAY[l.photos->0->>'url']) as listing,
              json_build_object('id', h.id, 'full_name', h.full_name, 'avatar_url', h.avatar_url, 'phone', h.phone) as host,
              json_build_object('id', g.id, 'full_name', g.full_name, 'avatar_url', g.avatar_url) as guest,
              b.check_in, b.check_out, b.nights, b.status, b.booking_type, b.price_breakdown, b.payment_status, b.special_requests, b.created_at
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users h ON b.host_id = h.id
       JOIN users g ON b.guest_id = g.id
       WHERE b.id = $1 AND (b.guest_id = $2 OR b.host_id = $2)`,
      [bookingId, userId]
    );

    if (result.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized or not found" });

    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const cancelGuestBooking = async (req, res) => { 
  try {
    const guestId = req.user.sub;
    const { id: bookingId } = req.params;
    const { reason } = req.body;

    // 1. Update Booking Status
    const result = await query(
      `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() 
       WHERE id = $1 AND guest_id = $2 AND status IN ('PENDING', 'CONFIRMED')
       RETURNING id as booking_id, status, host_id, listing_id`,
      [bookingId, guestId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Booking cannot be cancelled" });
    const booking = result.rows[0];

    // 2. Fetch Listing info for notification
    const listingRes = await query("SELECT title FROM listings WHERE id = $1", [booking.listing_id]);
    const listingTitle = listingRes.rows[0]?.title || "Property";

    // 3. Create In-App Notifications
    // For Host
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [booking.host_id, "Booking Cancelled ❌", `The booking for ${listingTitle} has been cancelled by the guest.${reason ? ` Reason: ${reason}` : ''}`, "booking_cancelled"]
    );

    // For Guest
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [guestId, "Trip Cancelled ❌", `You have cancelled your trip to ${listingTitle}.${reason ? ` Reason: ${reason}` : ''}`, "booking_cancelled"]
    );

    // 4. Send Cancellation Emails
    try {
      const info = await query(
        `SELECT u.email as guest_email, u.full_name as guest_name, 
                h.email as host_email, h.full_name as host_name,
                l.title as listing_title
         FROM users u, users h, listings l
         WHERE u.id = $1 AND h.id = $2 AND l.id = $3`,
        [guestId, booking.host_id, booking.listing_id]
      );
      if (info.rows.length > 0) {
        const bd = info.rows[0];
        // To Host
        await sendGuestCancellationEmailToHost(bd.host_email, {
          host_name: bd.host_name,
          guest_name: bd.guest_name,
          listing_title: bd.listing_title,
          booking_id: booking.booking_id,
          reason
        });
        // To Guest
        await sendGuestCancellationEmailToGuest(bd.guest_email, {
          guest_name: bd.guest_name,
          listing_title: bd.listing_title,
          booking_id: booking.booking_id
        });
      }
    } catch (err) { console.error("Guest cancel email failed:", err.message); }

    res.json({
      success: true,
      booking_id: booking.booking_id,
      status: 'CANCELLED',
      message: "Booking cancelled successfully."
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const getBookingPriceBreakdown = async (req, res) => { 
  try { /* Simple stub since it's injected tightly into createBooking as well */
    res.json({ success: true, data: { base: 100, fees: 20, taxes: 10, total: 130 } });
  } catch (err) {}
};

// Host Booking Moderation
export const getIncomingRequests = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { status = 'PENDING', limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT b.id as booking_id, l.title as listing_title, 
              u.full_name as guest_name, u.avatar_url as guest_avatar,
              b.check_in, b.check_out, b.nights, (b.price_breakdown->>'total')::int as total,
              b.status, b.booking_type, b.created_at
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.guest_id = u.id
       WHERE b.host_id = $1 AND b.status = $2
       ORDER BY b.created_at DESC LIMIT $3 OFFSET $4`,
      [hostId, status, limit, offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const acceptBooking = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: bookingId } = req.params;

    const result = await query(
      `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() 
       WHERE id = $1 AND host_id = $2 AND status = 'PENDING'
       RETURNING id as booking_id, status`,
      [bookingId, hostId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Unable to confirm" });

    res.json({ booking_id: result.rows[0].booking_id, status: 'CONFIRMED', message: "Booking confirmed." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const declineBooking = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: bookingId } = req.params;

    const result = await query(
      `UPDATE bookings SET status = 'REJECTED', updated_at = NOW() 
       WHERE id = $1 AND host_id = $2 AND status = 'PENDING'
       RETURNING id as booking_id, status`,
      [bookingId, hostId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Unable to decline" });
    
    res.json({ booking_id: result.rows[0].booking_id, status: 'REJECTED', message: "Booking declined." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const cancelHostBooking = async (req, res) => { 
  try {
    const hostId = req.user.sub;
    const { id: bookingId } = req.params;
    const { reason } = req.body;

    // 1. Update Booking Status
    const result = await query(
      `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() 
       WHERE id = $1 AND host_id = $2 AND status IN ('PENDING', 'CONFIRMED')
       RETURNING id as booking_id, status, guest_id, listing_id`,
      [bookingId, hostId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Booking cannot be cancelled" });
    const booking = result.rows[0];

    // 2. Fetch Listing info for notification
    const listingRes = await query("SELECT title FROM listings WHERE id = $1", [booking.listing_id]);
    const listingTitle = listingRes.rows[0]?.title || "Property";

    // 3. Create In-App Notifications
    // For Guest
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [booking.guest_id, "Booking Cancelled by Host ❌", `Unfortunately, the host had to cancel your booking for ${listingTitle}.${reason ? ` Reason: ${reason}` : ''}`, "booking_cancelled"]
    );

    // For Host
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [hostId, "Booking Cancelled ❌", `You cancelled the booking for ${listingTitle}.${reason ? ` Reason: ${reason}` : ''}`, "booking_cancelled"]
    );

    res.json({
      success: true,
      booking_id: booking.booking_id,
      status: 'CANCELLED',
      message: "Booking cancelled by host."
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};