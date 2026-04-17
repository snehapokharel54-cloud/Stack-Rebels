import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../config/db.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import {
  validateHostSignup,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middlewares/validators.js";
import { sendResetEmail, sendVerificationEmail, sendHostWelcomeEmail } from "../utils/mailer.js";

const router = Router();

// ─── POST /signup ────────────────────────────────────────────────────
router.post("/signup", validateHostSignup, async (req, res) => {
  try {
    const { email, 
      full_name, 
      password, 
      phone } = req.body;

    // Check if email already exists
    const existing = await query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
        errors: [{ field: "email", message: "Email is already registered." }],
      });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12);

    // Insert host (is_host = true)
    const result = await query(
      `INSERT INTO users (email, full_name, password_hash, phone, is_host)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING id, email, full_name, avatar_url, phone, is_host, is_superhost, is_verified, created_at`,
      [email, full_name, password_hash, phone]
    );

    const host = result.rows[0];

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save to DB
    await query(
      `INSERT INTO email_verifications (user_id, otp_hash, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET otp_hash = $2, expires_at = $3, created_at = NOW()`,
      [host.id, otpHash, expiresAt]
    );

    // Send the verification email
    try {
      await sendVerificationEmail(host.email, otp);
    } catch (err) {
      console.warn("[DEV] Verification email send failed, but OTP was saved to DB.");
    }

    // Send the welcome email
    try {
      await sendHostWelcomeEmail(host.email, host.full_name);
    } catch (err) {
      console.warn("[DEV] Welcome email send failed, but host was registered successfully.");
    }

    // Generate JWT
    const token = jwt.sign(
      { sub: host.id, role: "host", email: host.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Host registered successfully.",
      data: { user: host, token },
    });
  } catch (error) {
    console.error("Host signup error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
});

// ─── POST /verify-email ─────────────────────────────────────────────
router.post("/verify-email", rateLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required.", errors: [] });
    }

    const cleanEmail = email.trim().toLowerCase();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    // Check OTP
    const result = await query(
      `SELECT ev.user_id, ev.expires_at 
       FROM email_verifications ev
       JOIN users u ON u.id = ev.user_id
       WHERE u.email = $1 AND ev.otp_hash = $2`,
      [cleanEmail, otpHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid verification code.", errors: [] });
    }

    const record = result.rows[0];

    if (new Date() > new Date(record.expires_at)) {
      await query("DELETE FROM email_verifications WHERE user_id = $1", [record.user_id]);
      return res.status(400).json({ success: false, message: "Verification code has expired. Please request a new one.", errors: [] });
    }

    // Mark as verified
    await query("UPDATE users SET is_verified = TRUE WHERE id = $1", [record.user_id]);
    await query("DELETE FROM email_verifications WHERE user_id = $1", [record.user_id]);

    return res.status(200).json({ success: true, message: "Email successfully verified!", data: {} });
  } catch (error) {
    console.error("Verification error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error.", errors: [] });
  }
});

// ─── POST /login ─────────────────────────────────────────────────────
router.post("/login", rateLimiter, validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Must be a host
    const result = await query(
      "SELECT * FROM users WHERE email = $1 AND is_host = TRUE",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        errors: [],
      });
    }

    const host = result.rows[0];

    const isMatch = await bcrypt.compare(password, host.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        errors: [],
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { sub: host.id, role: "host", email: host.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Destructure out password_hash
    const { password_hash: _, ...safeHost } = host;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: { user: safeHost, token },
    });
  } catch (error) {
    console.error("Host login error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
});

// ─── POST /forgot-password ──────────────────────────────────────────
router.post("/forgot-password", rateLimiter, validateForgotPassword, async (req, res) => {
  try {
    const { email } = req.body;

    // Always respond 200 to prevent email enumeration
    const result = await query(
      "SELECT id, email FROM users WHERE email = $1 AND is_host = TRUE",
      [email]
    );

    if (result.rows.length > 0) {
      const host = result.rows[0];

      // Generate raw token
      const rawToken = crypto.randomBytes(32).toString("hex");

      // Hash the token for storage
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

      // Expire in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Upsert into password_resets
      await query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE
         SET token_hash = $2, expires_at = $3, created_at = NOW()`,
        [host.id, tokenHash, expiresAt]
      );

      // Send email with raw token
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}&type=host`;
      await sendResetEmail(host.email, resetUrl);
    }

    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent.",
      data: {},
    });
  } catch (error) {
    console.error("Host forgot-password error:", error.message);
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

    // Find valid reset record and verify user is a host
    const result = await query(
      `SELECT pr.user_id, pr.expires_at
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1 AND u.is_host = TRUE`,
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
      await query("DELETE FROM password_resets WHERE user_id = $1", [resetRecord.user_id]);
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
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [password_hash, resetRecord.user_id]
    );

    // Delete used token
    await query("DELETE FROM password_resets WHERE user_id = $1", [resetRecord.user_id]);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
      data: {},
    });
  } catch (error) {
    console.error("Host reset-password error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      errors: [],
    });
  }
});

export default router;
