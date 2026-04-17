import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../config/db.js";
import { strictRateLimiter } from "../middlewares/rateLimiter.js";
import {
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validators.js";
import { sendResetEmail } from "../utils/mailer.js";

const router = Router();

// ❌ NO /signup route — admin registration must NEVER be a public endpoint.

// ─── POST /login ─────────────────────────────────────────────────────
router.post("/login", strictRateLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      "SELECT * FROM admins WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        errors: [],
      });
    }

    const admin = result.rows[0];

    // Must be an active admin
    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: "This admin account has been deactivated.",
        errors: [],
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        errors: [],
      });
    }

    // Update last_login_at
    await query(
      "UPDATE admins SET last_login_at = NOW() WHERE id = $1",
      [admin.id]
    );

    // Generate JWT — 2h expiry for admin (more secure)
    const token = jwt.sign(
      { sub: admin.id, role: "admin", email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // Destructure out password_hash
    const { password_hash: _, ...safeAdmin } = admin;

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      data: { admin: safeAdmin, token },
    });
  } catch (error) {
    console.error("Admin login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
});

// ─── POST /forgot-password ──────────────────────────────────────────
router.post("/forgot-password", strictRateLimiter, validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;

    // Always respond 200 to prevent email enumeration
    const result = await query(
      "SELECT id, email FROM admins WHERE email = $1 AND is_active = TRUE",
      [email]
    );

    if (result.rows.length > 0) {
      const admin = result.rows[0];

      // Generate raw token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Hash the token for storage
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Expire in 10 minutes (stricter for admin)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      // Upsert into admin_password_resets
      await query(
        `INSERT INTO admin_password_resets (admin_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (admin_id) DO UPDATE
         SET token_hash = $2, expires_at = $3, created_at = NOW()`,
        [admin.id, tokenHash, expiresAt]
      );

      // Send email with raw token
      const resetUrl = `${process.env.ADMIN_PANEL_URL}/reset-password?token=${rawToken}`;
      await sendResetEmail(admin.email, resetUrl);
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      data: {},
    });
  } catch (error) {
    console.error("Admin forgot-password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
});

// ─── POST /reset-password ───────────────────────────────────────────
router.post("/reset-password", validateResetPassword, async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the incoming token to compare
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find valid reset record
    const result = await query(
      `SELECT apr.admin_id, apr.expires_at
       FROM admin_password_resets apr
       JOIN admins a ON a.id = apr.admin_id
       WHERE apr.token_hash = $1 AND a.is_active = TRUE`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
        errors: [],
      });
    }

    const resetRecord = result.rows[0];

    // Check expiry
    if (new Date() > new Date(resetRecord.expires_at)) {
      await query("DELETE FROM admin_password_resets WHERE admin_id = $1", [resetRecord.admin_id]);
      return res.status(400).json({
        success: false,
        message: "Reset token has expired. Please request a new one.",
        errors: [],
      });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // Update password
    await query(
      "UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [password_hash, resetRecord.admin_id]
    );

    // Delete used token
    await query("DELETE FROM admin_password_resets WHERE admin_id = $1", [resetRecord.admin_id]);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
      data: {},
    });
  } catch (error) {
    console.error("Admin reset-password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
});

export default router;
