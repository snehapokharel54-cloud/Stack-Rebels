import axios from "axios";
import { query } from "../config/db.js";
import { sendBookingConfirmationEmail, sendHostNewBookingEmail } from "../utils/mailer.js";
import { sendPushNotification } from "../utils/firebase.js";


const KHALTI_BASE_URL = "https://khalti.com/api/v1";
// Note: Khalti v1 usually uses the same endpoint for sandbox, 
// differrentiated by the Secret Key used.

/**
 * POST /v1/payments/khalti/create-intent
 * Initiates a Khalti ePayment for a pending booking.
 * Body: { booking_id }
 */
export const initiateKhaltiPayment = async (req, res) => {
  console.log("🚀 [DEBUG] EXECUTING KHALTI V2 ePayment INITIATE HANDLER");
  try {
    const userId = req.user.sub;
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: "booking_id is required" });
    }

    // 1. Fetch the booking and user details
    const bookingResult = await query(
      `SELECT b.id, b.guest_id, b.listing_id, b.status, b.payment_status,
              b.price_breakdown, l.title as listing_title,
              u.full_name, u.email, u.phone
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
       JOIN users u ON b.guest_id = u.id
       WHERE b.id = $1`,
      [booking_id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const booking = bookingResult.rows[0];

    if (booking.guest_id !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const priceBreakdown = typeof booking.price_breakdown === "string"
      ? JSON.parse(booking.price_breakdown)
      : booking.price_breakdown;

    const totalNPR = priceBreakdown?.total || 0;
    const amountInPaisa = Math.round(totalNPR * 100);
    
    // 2. Call Khalti v2 Initiate API
    const khaltiInitiateUrl = "https://dev.khalti.com/api/v2/epayment/initiate/";
    const returnUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success?booking_id=${booking.id}`;
    
    const khaltiPayload = {
      return_url: returnUrl,
      website_url: process.env.CLIENT_URL || 'http://localhost:5173',
      amount: amountInPaisa,
      purchase_order_id: booking.id,
      purchase_order_name: `Booking: ${booking.listing_title}`,
      customer_info: {
        name: booking.full_name || 'Guest',
        email: booking.email || 'guest@example.com',
        phone: booking.phone || '9800000000'
      }
    };

    console.log("[KHALTI] Sending v2 Initiate Payload:", JSON.stringify(khaltiPayload, null, 2));

    const khaltiResponse = await axios.post(
      khaltiInitiateUrl,
      khaltiPayload,
      {
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { pidx, payment_url } = khaltiResponse.data;

    // 3. Store the pidx and initialize payment record
    await query(
      `INSERT INTO payments (booking_id, user_id, amount, status, gateway, amount_npr, khalti_pidx)
       VALUES ($1, $2, $3, 'INITIALIZED', 'khalti', $4, $5)
       ON CONFLICT (booking_id) DO UPDATE
       SET status = 'INITIALIZED', gateway = 'khalti', khalti_pidx = $5, updated_at = NOW()`,
      [booking.id, userId, (totalNPR / 133).toFixed(2), totalNPR, pidx]
    );

    res.json({
      success: true,
      booking_id: booking.id,
      payment_url: payment_url,
      pidx: pidx
    });
  } catch (error) {
    const apiError = error.response?.data;
    console.error("Khalti v2 initiate error:", apiError || error.message);
    res.status(500).json({ 
      success: false, 
      message: apiError ? JSON.stringify(apiError) : error.message 
    });
  }
};

/**
 * POST /v1/payments/khalti/verify
 * Called by the frontend after redirect from Khalti with pidx in query string
 * Body: { pidx, booking_id }
 */
export const verifyKhaltiPayment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { token, amount, pidx, booking_id } = req.body;

    if ((!token && !pidx) || (!amount && !pidx) || !booking_id) {
      return res.status(400).json({ success: false, message: "Verification parameters and booking_id are required" });
    }

    console.log(`[KHALTI] Verifying ${pidx ? 'PIDX' : 'Token'}: ${pidx || token}, Booking: ${booking_id}...`);

    let khaltiResponse;
    const isV2 = !!pidx;
    const endpoint = isV2 ? "https://dev.khalti.com/api/v2/epayment/lookup/" : `${KHALTI_BASE_URL}/payment/verify/`;
    const payload = isV2 ? { pidx } : { token, amount };

    try {
      khaltiResponse = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (apiError) {
      const apiStatus = apiError.response?.status || 500;
      const apiData = apiError.response?.data;
      console.error(`[KHALTI] API Connection Error (Status ${apiStatus}):`, apiData || apiError.message);
      return res.status(apiStatus).json({
        success: false,
        message: `Khalti API Error: ${JSON.stringify(apiData) || apiError.message}`
      });
    }

    if (!khaltiResponse?.data) {
      throw new Error("No data received from Khalti API");
    }

    console.log(`[KHALTI] API Response Data:`, JSON.stringify(khaltiResponse.data, null, 2));
    
    // v1 verification response includes the verified amount and other details.
    // Usually if the request succeeds with 200, it's verified.

    console.log(`[KHALTI] Payment CONFIRMED for booking ${booking_id}. Updating local database...`);

    // 2. Wrap database updates in a dedicated try-catch
    try {
      await query(
        `UPDATE bookings SET payment_status = 'paid', status = 'CONFIRMED', updated_at = NOW()
         WHERE id = $1 AND guest_id = $2`,
        [booking_id, userId]
      );

      await query(
        `UPDATE payments SET status = 'succeeded', khalti_pidx = $2, updated_at = NOW()
         WHERE booking_id = $1`,
        [booking_id, token]
      );
    } catch (dbError) {
      console.error(`[KHALTI] Database update failed:`, dbError.message);
      return res.status(500).json({ success: false, message: "Payment verified but database update failed. Please contact support." });
    }

    // 4. Send Notifications & Emails (non-blocking)
    try {
      const bookingInfo = await query(`
        SELECT b.id, b.check_in, b.check_out, b.price_breakdown, b.host_id, b.guest_id,
               l.title as listing_title, 
               gu.email as guest_email, gu.full_name as guest_name,
               hu.email as host_email, hu.full_name as host_name, hu.phone as host_phone
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        JOIN users gu ON b.guest_id = gu.id
        JOIN users hu ON b.host_id = hu.id
        WHERE b.id = $1
      `, [booking_id]);

      if (bookingInfo.rows.length > 0) {
        const bi = bookingInfo.rows[0];
        const pb = typeof bi.price_breakdown === 'string' ? JSON.parse(bi.price_breakdown) : bi.price_breakdown;
        
        // A. Send Emails
        await sendBookingConfirmationEmail(bi.guest_email, {
          guest_name: bi.guest_name,
          listing_title: bi.listing_title,
          check_in: bi.check_in,
          check_out: bi.check_out,
          total_amount: pb?.total || 0,
          booking_id: bi.id,
          host_phone: bi.host_phone
        });

        await sendHostNewBookingEmail(bi.host_email, {
          host_name: bi.host_name,
          guest_name: bi.guest_name,
          listing_title: bi.listing_title,
          check_in: bi.check_in,
          check_out: bi.check_out,
          total_amount: pb?.total || 0,
          booking_id: bi.id
        });

        // B. Create In-App Notifications
        await query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [bi.guest_id, "Booking Confirmed! 🎉", `Your stay at ${bi.listing_title} has been confirmed.`, "booking_confirmation"]
        );

        await query(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES ($1, $2, $3, $4)`,
          [bi.host_id, "New Booking Received! 🥳", `${bi.guest_name} just booked ${bi.listing_title}.`, "new_booking"]
        );

        // C. Send Push Notifications (Firebase)
        try {
          const guestMsg = `Your booking for ${bi.listing_title} is confirmed!`;
          await sendPushNotification(bi.guest_fcm, "Booking Confirmed", guestMsg, { route: '/bookings' });

          const hostMsg = `${bi.guest_name} booked ${bi.listing_title}!`;
          await sendPushNotification(bi.host_fcm, "New Booking Received", hostMsg, { route: '/vendor' });
        } catch (pushErr) {
          console.error("Push notification error:", pushErr);
        }

        console.log(`[KHALTI] Notifications and emails sent for booking ${booking_id}`);
      }
    } catch (notifErr) {
      console.error("[KHALTI] Notification/Email block failed:", notifErr.message);
    }

    res.json({
      success: true,
      message: "Khalti payment verified and booking confirmed!",
      booking_id,
      status: "CONFIRMED",
      payment_status: "paid",
    });
  } catch (error) {
    console.error(`[KHALTI] Fatal Unexpected Error:`, error.message);
    res.status(500).json({ success: false, message: `Unexpected error: ${error.message}` });
  }
};
