import { query } from "../config/db.js";
import { 
  sendBookingConfirmationEmail, 
  sendBookingRejectionEmail, 
  sendHostCancellationEmailToGuest 
} from "../utils/mailer.js";

/**
 * GET /v1/host/bookings/incoming
 * Get pending booking requests for the host's listings
 */
export const getIncomingBookings = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT b.id as booking_id, b.id, l.title as listing_title, 
              u.full_name as guest_name, u.avatar_url as guest_avatar, u.email as guest_email,
              b.check_in, b.check_out, b.nights, b.total_price, b.price_breakdown,
              b.status, b.booking_type, b.created_at, b.special_requests, b.num_guests
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.guest_id = u.id
       WHERE b.host_id = $1 AND b.status = 'PENDING'
       ORDER BY b.created_at DESC LIMIT $2 OFFSET $3`,
      [hostId, limit, offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /v1/host/bookings/history
 * Get all past and confirmed bookings for the host
 */
export const getBookingHistory = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { status, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT b.id as booking_id, b.id, l.title as listing_title, 
                      u.full_name as guest_name, u.avatar_url as guest_avatar,
                      b.check_in, b.check_out, b.nights, b.total_price, b.price_breakdown,
                      b.status, b.payment_status, b.created_at
               FROM bookings b
               JOIN listings l ON b.listing_id = l.id
               JOIN users u ON b.guest_id = u.id
               WHERE b.host_id = $1`;
    let params = [hostId];

    if (status) {
      params.push(status);
      sql += ` AND b.status = $2`;
    } else {
      sql += ` AND b.status != 'PENDING'`;
    }

    sql += ` ORDER BY b.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /v1/host/bookings/:id/confirm
 */
export const confirmBooking = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id: bookingId } = req.params;

    const result = await query(
      `UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() 
       WHERE id = $1 AND host_id = $2 AND status = 'PENDING'
       RETURNING id as booking_id, status, guest_id, listing_id, check_in, check_out, total_price`,
      [bookingId, hostId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Unable to confirm booking. It may already be processed or not found." });

    const booking = result.rows[0];

    // Create notification for guest
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [booking.guest_id, "Booking Confirmed! ✅", "Your booking has been accepted by the host. Get ready for your trip!", "booking_confirmed"]
    );

    // Send Confirmation Email
    try {
      const info = await query(
        `SELECT u.email as guest_email, u.full_name as guest_name, l.title as listing_title, h.phone as host_phone
         FROM users u, listings l, users h
         WHERE u.id = $1 AND l.id = $2 AND h.id = $3`,
        [booking.guest_id, booking.listing_id, hostId]
      );
      if (info.rows.length > 0) {
        const guest = info.rows[0];
        await sendBookingConfirmationEmail(guest.guest_email, {
          guest_name: guest.guest_name,
          listing_title: guest.listing_title,
          check_in: booking.check_in,
          check_out: booking.check_out,
          total_amount: booking.total_price,
          booking_id: booking.booking_id,
          host_phone: guest.host_phone
        });
      }
    } catch (err) { console.error("Confirm email failed:", err.message); }

    res.json({ success: true, data: booking, message: "Booking confirmed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /v1/host/bookings/:id/decline
 */
export const declineBooking = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id: bookingId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE bookings SET status = 'REJECTED', updated_at = NOW() 
       WHERE id = $1 AND host_id = $2 AND status = 'PENDING'
       RETURNING id as booking_id, status, guest_id, listing_id`,
      [bookingId, hostId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Unable to decline booking." });

    const booking = result.rows[0];

    // Create notification for guest
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [booking.guest_id, "Booking Declined ❌", `The host declined your booking request.${reason ? ` Reason: ${reason}` : ''}`, "booking_rejected"]
    );

    // Send Rejection Email
    try {
      const info = await query(
        `SELECT u.email as guest_email, u.full_name as guest_name, l.title as listing_title
         FROM users u, listings l WHERE u.id = $1 AND l.id = $2`,
        [booking.guest_id, booking.listing_id]
      );
      if (info.rows.length > 0) {
        await sendBookingRejectionEmail(info.rows[0].guest_email, {
          guest_name: info.rows[0].guest_name,
          listing_title: info.rows[0].listing_title,
          reason
        });
      }
    } catch (err) { console.error("Decline email failed:", err.message); }

    res.json({ success: true, message: "Booking declined." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /v1/host/bookings/:id/cancel
 */
export const cancelConfirmedBooking = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id: bookingId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() 
       WHERE id = $1 AND host_id = $2 AND status = 'CONFIRMED'
       RETURNING id as booking_id, status, guest_id, listing_id`,
      [bookingId, hostId]
    );

    if (result.rows.length === 0) return res.status(400).json({ success: false, message: "Booking cannot be cancelled. It must be in 'CONFIRMED' status." });

    const booking = result.rows[0];

    // Create notification for guest
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [booking.guest_id, "Booking Cancelled by Host ❌", `Unfortunately, the host had to cancel your booking.${reason ? ` Reason: ${reason}` : ''}`, "booking_cancelled"]
    );

    // Send Cancellation Email
    try {
      const info = await query(
        `SELECT u.email as guest_email, u.full_name as guest_name, l.title as listing_title
         FROM users u, listings l WHERE u.id = $1 AND l.id = $2`,
        [booking.guest_id, booking.listing_id]
      );
      if (info.rows.length > 0) {
        await sendHostCancellationEmailToGuest(info.rows[0].guest_email, {
          guest_name: info.rows[0].guest_name,
          listing_title: info.rows[0].listing_title,
          booking_id: booking.booking_id,
          reason
        });
      }
    } catch (err) { console.error("Cancel email failed:", err.message); }

    res.json({ success: true, message: "Booking cancelled by host." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
