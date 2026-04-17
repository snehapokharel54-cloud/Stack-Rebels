import Stripe from "stripe";
import { query } from "../config/db.js";
import { sendBookingConfirmationEmail, sendHostNewBookingEmail } from "../utils/mailer.js";
import { sendPushNotification } from "../utils/firebase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /v1/payments/create-intent
 * Creates a Stripe PaymentIntent for a pending booking.
 * Body: { booking_id }
 */
export const initiatePayment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: "booking_id is required" });
    }

    // 1. Fetch the booking and verify it belongs to this guest
    const bookingResult = await query(
      `SELECT b.id, b.guest_id, b.listing_id, b.status, b.payment_status,
              b.price_breakdown, l.title as listing_title
       FROM bookings b
       JOIN listings l ON b.listing_id = l.id
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

    if (booking.payment_status === "paid") {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    // 2. Extract amount from price_breakdown
    const priceBreakdown = typeof booking.price_breakdown === "string"
      ? JSON.parse(booking.price_breakdown)
      : booking.price_breakdown;

    const totalNPR = priceBreakdown?.total || 0;
    if (totalNPR <= 0) {
      return res.status(400).json({ success: false, message: "Invalid booking total" });
    }

    // Convert NPR to USD cents for Stripe (approx 1 USD = 133 NPR)
    const NPR_TO_USD_RATE = 133;
    const amountUSDCents = Math.max(50, Math.round((totalNPR / NPR_TO_USD_RATE) * 100)); // min $0.50

    // 3. Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountUSDCents,
      currency: "usd",
      metadata: {
        booking_id: booking.id,
        user_id: userId,
        listing_title: booking.listing_title,
        total_npr: totalNPR.toString(),
      },
      description: `Grihastha Booking: ${booking.listing_title}`,
    });

    // 4. Store the payment intent reference in DB
    await query(
      `INSERT INTO payments (booking_id, user_id, amount, stripe_payment_intent_id, amount_npr, amount_usd_cents, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'INITIALIZED')
       ON CONFLICT (booking_id) DO UPDATE
       SET stripe_payment_intent_id = $4, amount_usd_cents = $6, status = 'INITIALIZED', updated_at = NOW()`,
      [booking.id, userId, (amountUSDCents / 100).toFixed(2), paymentIntent.id, totalNPR, amountUSDCents]
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: {
        npr: totalNPR,
        usd_cents: amountUSDCents,
        usd_display: `$${(amountUSDCents / 100).toFixed(2)}`,
      },
    });
  } catch (error) {
    console.error("Stripe create-intent error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /v1/payments/verify
 * Called by the frontend after stripe.confirmPayment succeeds.
 * Body: { booking_id, payment_intent_id }
 */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { booking_id, payment_intent_id } = req.body;

    if (!booking_id || !payment_intent_id) {
      return res.status(400).json({ success: false, message: "booking_id and payment_intent_id are required" });
    }

    // 1. Verify with Stripe that payment actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // 2. Update booking status
    await query(
      `UPDATE bookings SET payment_status = 'paid', status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1 AND guest_id = $2`,
      [booking_id, userId]
    );

    // 3. Update payment record
    await query(
      `UPDATE payments SET status = 'succeeded', updated_at = NOW()
       WHERE booking_id = $1 AND stripe_payment_intent_id = $2`,
      [booking_id, payment_intent_id]
    );

    // 4. Send Confirmation Email & Notifications
    try {
      const emailQuery = await query(`
        SELECT b.id, b.check_in, b.check_out, b.price_breakdown, b.host_id, b.guest_id,
               l.title as listing_title, 
               u.email as guest_email, u.full_name as guest_name,
               h.email as host_email, h.full_name as host_name, h.phone as host_phone
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        JOIN users u ON b.guest_id = u.id
        JOIN users h ON b.host_id = h.id
        WHERE b.id = $1
      `, [booking_id]);

      if (emailQuery.rows.length > 0) {
        const bd = emailQuery.rows[0];
        const pb = typeof bd.price_breakdown === 'string' ? JSON.parse(bd.price_breakdown) : bd.price_breakdown;
        const totalPaid = pb?.total || 0;

        // DB Notifications
        const guestMsg = `Your booking for ${bd.listing_title} (${new Date(bd.check_in).toLocaleDateString()} to ${new Date(bd.check_out).toLocaleDateString()}) is confirmed!`;
        await query(
          "INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)",
          [bd.guest_id, "Booking Confirmed", guestMsg, "booking"]
        );
        
        const hostMsg = `New booking!\n${bd.guest_name} booked ${bd.listing_title} for ${new Date(bd.check_in).toLocaleDateString()} to ${new Date(bd.check_out).toLocaleDateString()}.`;
        await query(
          "INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)",
          [bd.host_id, "New Booking Received", hostMsg, "booking"]
        );

        // Emails
        await sendBookingConfirmationEmail(bd.guest_email, {
          guest_name: bd.guest_name || 'Guest',
          listing_title: bd.listing_title,
          check_in: bd.check_in,
          check_out: bd.check_out,
          total_amount: totalPaid,
          booking_id: bd.id,
          host_phone: bd.host_phone
        });

        await sendHostNewBookingEmail(bd.host_email, {
          host_name: bd.host_name,
          guest_name: bd.guest_name || 'Guest',
          listing_title: bd.listing_title,
          check_in: bd.check_in,
          check_out: bd.check_out,
          total_amount: totalPaid,
          booking_id: bd.id
        });

        // Firebase Push
        if (bd.guest_fcm) {
          await sendPushNotification(bd.guest_fcm, "Booking Confirmed", guestMsg, { route: '/bookings' });
        }
        if (bd.host_fcm) {
          await sendPushNotification(bd.host_fcm, "New Booking Received", hostMsg, { route: '/host-dashboard' });
        }
      }
    } catch (e) {
      console.error("Failed to process post-payment actions (emails/notifications):", e);
    }

    res.json({
      success: true,
      message: "Payment verified and booking confirmed!",
      booking_id,
      status: "CONFIRMED",
      payment_status: "paid",
    });
  } catch (error) {
    console.error("Payment verify error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /v1/payments/history
 * Returns all payment records for the authenticated user's bookings.
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.sub;

    const result = await query(
      `SELECT p.id, p.booking_id, p.amount_npr, p.amount_usd_cents, p.status,
              p.stripe_payment_intent_id, p.created_at,
              l.title as listing_title
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       WHERE b.guest_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Payment history error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /v1/payments/webhook
 * Stripe webhook endpoint (called by Stripe servers).
 * NOTE: This must receive raw body, NOT parsed JSON.
 */
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body, // must be raw buffer
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const bookingId = paymentIntent.metadata.booking_id;

    if (bookingId) {
      await query(
        `UPDATE bookings SET payment_status = 'paid', status = 'CONFIRMED', updated_at = NOW()
         WHERE id = $1`,
        [bookingId]
      );
      await query(
        `UPDATE payments SET status = 'succeeded', updated_at = NOW()
         WHERE stripe_payment_intent_id = $1`,
        [paymentIntent.id]
      );
      console.log(`✅ Webhook: Payment confirmed for booking ${bookingId}`);
    }
  }

  res.json({ received: true });
};