import nodemailer from "nodemailer";

/**
 * Email transporter configuration using environment variables.
 * Supports SMTP-based email services (Gmail, Outlook, custom SMTP, etc.).
 */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send verification email to newly registered users.
 * @param {string} email - Recipient email address
 * @param {string} verificationToken - Token for email verification link
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your Grihastha account",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Welcome to Grihastha!</h2>
            <p>Please verify your email address to activate your account.</p>
            <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Verify Email
            </a>
            <p>Or copy this link: ${verificationUrl}</p>
            <p>This link expires in 24 hours.</p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

/**
 * Send password reset email to users who requested password recovery.
 * @param {string} email - Recipient email address
 * @param {string} resetToken - Token for password reset link
 * @returns {Promise<void>}
 */
export const sendResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset your Grihastha password",
      html: `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the link below to proceed:</p>
            <a href="${resetUrl}" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
            <p>Or copy this link: ${resetUrl}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending reset email:", error);
    throw error;
  }
};
