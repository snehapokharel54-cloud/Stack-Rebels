import { query } from "../config/db.js";

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.sub;
    const result = await query(
      "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
      [userId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.sub;
    const { id } = req.params;
    await query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    res.json({ success: true, message: 'Marked read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.sub;
    await query(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = $1",
      [userId]
    );
    res.json({ success: true, message: 'All marked read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};