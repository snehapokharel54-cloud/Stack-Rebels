import Stripe from "stripe";
import { query } from "../config/db.js";
import { sendBookingConfirmationEmail, sendHostNewBookingEmail } from "../utils/mailer.js";
import { sendPushNotification } from "../utils/firebase.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /v1/payments/create-intent
 * Creates a Stripe Checkout Session for a hosted redirect payment.
 * Body: { booking_id }
 */
export const initiatePayment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ success: false, message: "booking_id is required" });
    }

    // 1. Fetch the booking 
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

    // 2. Extract amount
    const priceBreakdown = typeof booking.price_breakdown === "string"
      ? JSON.parse(booking.price_breakdown)
      : booking.price_breakdown;

    const totalNPR = priceBreakdown?.total || 0;
    const NPR_TO_USD_RATE = 133;
    const amountUSDCents = Math.max(50, Math.round((totalNPR / NPR_TO_USD_RATE) * 100));

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Stay at ${booking.listing_title}`,
              description: `Booking for ${booking.listing_title}`,
            },
            unit_amount: amountUSDCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/payment-success?gateway=stripe&session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/property/${booking.listing_id}?payment_cancelled=true`,
      metadata: {
        booking_id: booking.id,
        user_id: userId,
      },
    });

    // 4. Store session ID
    await query(
      `INSERT INTO payments (booking_id, user_id, amount, status, gateway, amount_npr, stripe_payment_intent_id)
       VALUES ($1, $2, $3, 'INITIALIZED', 'stripe', $4, $5)
       ON CONFLICT (booking_id) DO UPDATE
       SET stripe_payment_intent_id = $5, gateway = 'stripe', status = 'INITIALIZED', updated_at = NOW()`,
      [booking.id, userId, (amountUSDCents / 100).toFixed(2), totalNPR, session.id]
    );

    res.json({
      success: true,
      payment_url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /v1/payments/verify
 * Called by the frontend after Stripe return to verify payment status.
 * Body: { booking_id, payment_intent_id, session_id }
 */
export const verifyPayment = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { booking_id, payment_intent_id, session_id } = req.body;

    if (!booking_id || (!payment_intent_id && !session_id)) {
      return res.status(400).json({ success: false, message: "booking_id and either payment_intent_id or session_id are required" });
    }

    let pIntentId = payment_intent_id;

    // 1. If we have a session_id, retrieve the session to get the payment_intent
    if (session_id) {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      pIntentId = session.payment_intent;
    }

    if (!pIntentId) {
       return res.status(400).json({ success: false, message: "Could not find a valid payment intent for this session." });
    }

    // 2. Verify with Stripe that payment actually succeeded
    const paymentIntent = await stripe.paymentIntents.retrieve(pIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({
        success: false,
        message: `Payment not completed. Status: ${paymentIntent.status}`,
      });
    }

    // 3. Update booking status
    await query(
      `UPDATE bookings SET payment_status = 'paid', status = 'CONFIRMED', updated_at = NOW()
       WHERE id = $1 AND guest_id = $2`,
      [booking_id, userId]
    );

    // 4. Update payment record (handle both PI and Session lookup)
    await query(
      `UPDATE payments SET status = 'succeeded', stripe_payment_intent_id = $2, updated_at = NOW()
       WHERE booking_id = $1`,
      [booking_id, pIntentId]
    );

    // 5. Send Confirmation Email & Notifications
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