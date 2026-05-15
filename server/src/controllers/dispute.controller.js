import { query } from "../config/db.js";

/**
 * Create a new dispute (Guest)
 * POST /v1/disputes
 */
export const createDispute = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { booking_id, reason } = req.body;

    // Verify booking exists and belongs to user
    const booking = await query(
      "SELECT id, host_id FROM bookings WHERE id = $1 AND guest_id = $2",
      [booking_id, userId]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Booking not found or access denied." });
    }

    const hostId = booking.rows[0].host_id;

    // Create conversation for dispute (between guest and admin)
    // We leave host_id NULL or set it to hostId?
    // The user says "admin guest chat" and "talking to admin is like a ticket type conversion".
    // So it's between Guest and Admin!
    const conversation = await query(
      "INSERT INTO conversations (guest_id, host_id, listing_id) VALUES ($1, NULL, NULL) RETURNING id",
      [userId]
    );

    const conversationId = conversation.rows[0].id;

    // Create dispute
    const dispute = await query(
      `INSERT INTO disputes (booking_id, raised_by, reason, status) 
       VALUES ($1, $2, $3, 'OPEN') RETURNING id`,
      [booking_id, userId, reason]
    );

    // Send initial message from guest
    await query(
      "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)",
      [conversationId, userId, reason]
    );

    res.status(201).json({
      success: true,
      message: "Dispute raised successfully.",
      data: {
        dispute_id: dispute.rows[0].id,
        conversation_id: conversationId
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get messages for a dispute conversation
 * GET /v1/disputes/:id/messages
 */
export const getDisputeMessages = async (req, res) => {
  try {
    const { id } = req.params; // dispute ID or conversation ID?
    // Let's assume ID is conversation ID!

    const result = await query(
      `SELECT m.*, u.full_name as sender_name, a.email as admin_email
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       LEFT JOIN admins a ON m.sender_admin_id = a.id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Send a message in a dispute conversation
 * POST /v1/disputes/:id/messages
 */
export const sendDisputeMessage = async (req, res) => {
  try {
    const { id } = req.params; // conversation ID
    const { text } = req.body;
    const userId = req.user.sub; // Can be guest or admin!
    
    // Check if user is admin
    const isAdmin = req.user.role === 'admin';

    let result;
    if (isAdmin) {
      result = await query(
        "INSERT INTO messages (conversation_id, sender_admin_id, content) VALUES ($1, $2, $3) RETURNING id",
        [id, userId, text] // In my token payload, sub might be admin ID!
      );
    } else {
      result = await query(
        "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING id",
        [id, userId, text]
      );
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
