import { query } from "../config/db.js";

/**
 * Start or get existing conversation
 * POST /v1/conversations
 */
export const startConversation = async (req, res) => {
  try {
    const guestId = req.user.sub;
    const { hostId, listingId } = req.body;

    let existing;
    if (hostId) {
      existing = await query(
        `SELECT id FROM conversations 
         WHERE guest_id = $1 AND host_id = $2 
         ${listingId ? 'AND listing_id = $3' : 'AND listing_id IS NULL'}`,
        listingId ? [guestId, hostId, listingId] : [guestId, hostId]
      );
    } else {
      existing = await query(
        `SELECT id FROM conversations 
         WHERE guest_id = $1 AND host_id IS NULL 
         ${listingId ? 'AND listing_id = $2' : 'AND listing_id IS NULL'}`,
        listingId ? [guestId, listingId] : [guestId]
      );
    }

    if (existing.rows.length > 0) {
      return res.json({ success: true, id: existing.rows[0].id });
    }

    // Create new conversation
    const result = await query(
      "INSERT INTO conversations (guest_id, host_id, listing_id) VALUES ($1, $2, $3) RETURNING id",
      [guestId, hostId, listingId || null]
    );

    res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * List all conversations for the current user
 * GET /v1/conversations
 */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.sub;

    // Get conversations where user is guest or host
    const result = await query(
      `SELECT c.*, 
              u1.full_name as guest_name, u1.avatar_url as guest_avatar,
              u2.full_name as host_name, u2.avatar_url as host_avatar,
              l.title as listing_title
       FROM conversations c
       JOIN users u1 ON c.guest_id = u1.id
       LEFT JOIN users u2 ON c.host_id = u2.id
       LEFT JOIN listings l ON c.listing_id = l.id
       WHERE c.guest_id = $1 OR c.host_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Get messages in a conversation
 * GET /v1/conversations/:id/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    // Verify user is part of the conversation (or is admin)
    const isAdmin = req.user.role === 'admin';
    
    let conv;
    if (isAdmin) {
      conv = await query("SELECT id FROM conversations WHERE id = $1", [id]);
    } else {
      conv = await query(
        "SELECT id FROM conversations WHERE id = $1 AND (guest_id = $2 OR host_id = $2)",
        [id, userId]
      );
    }

    if (conv.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found" });
    }

    const result = await query(
      `SELECT m.*, u.full_name as sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
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
 * Send a message
 * POST /v1/conversations/:id/messages
 */
export const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.sub;

    // Verify user is part of the conversation (or is admin)
    const isAdmin = req.user.role === 'admin';
    
    let conv;
    if (isAdmin) {
      conv = await query("SELECT id FROM conversations WHERE id = $1", [id]);
    } else {
      conv = await query(
        "SELECT id FROM conversations WHERE id = $1 AND (guest_id = $2 OR host_id = $2)",
        [id, userId]
      );
    }

    if (conv.rows.length === 0) {
      return res.status(403).json({ success: false, message: "Access denied or conversation not found" });
    }

    let result;
    if (isAdmin) {
      result = await query(
        "INSERT INTO messages (conversation_id, sender_admin_id, content) VALUES ($1, $2, $3) RETURNING *",
        [id, userId, text]
      );
    } else {
      result = await query(
        "INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3) RETURNING *",
        [id, userId, text]
      );
    }

    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('receive_message', result.rows[0]);
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
