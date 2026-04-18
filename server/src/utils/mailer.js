import nodemailer from "nodemailer";

/**
 * Email transporter configuration using environment variables.
 * Supports SMTP-based email services (Gmail, Outlook, custom SMTP, etc.).
 */
let transporter = null;

try {
  // Check if SMTP settings are configured
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: parseInt(process.env.SMTP_PORT, 10) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 5000,
      socketTimeout: 5000,
    });
  } else {
    console.warn("[WARN] SMTP configuration incomplete - email sending will be disabled");
  }
} catch (error) {
  console.error("[ERROR] Failed to initialize email transporter:", error.message);
}

/**
 * Send verification email to newly registered users.
 * @param {string} email - Recipient email address
 * @param {string} verificationToken - Token for email verification link
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (email, verificationToken) => {
  if (!transporter) {
    console.warn("[WARN] Email transporter not configured, skipping verification email");
    return;
  }
  try {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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
  if (!transporter) {
    console.warn("[WARN] Email transporter not configured, skipping reset email");
    return;
  }
  try {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
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

/**
 * Send welcome email to newly registered hosts.
 * @param {string} email - Recipient email address
 * @param {string} hostName - Host's full name
 * @returns {Promise<void>}
 */
export const sendHostWelcomeEmail = async (email, hostName) => {
  if (!transporter) {
    console.warn("[WARN] Email transporter not configured, skipping welcome email");
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Welcome to Grihastha - Start Your Hosting Journey!",
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background-color: #ffffff;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                overflow: hidden;
              }
              .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: 600;
              }
              .content {
                padding: 40px 30px;
              }
              .greeting {
                font-size: 18px;
                color: #333;
                margin-bottom: 20px;
              }
              .section {
                margin: 25px 0;
              }
              .section h3 {
                color: #667eea;
                font-size: 16px;
                margin-bottom: 10px;
              }
              .section p {
                color: #555;
                line-height: 1.6;
                margin: 8px 0;
              }
              .feature-list {
                list-style: none;
                padding: 0;
                margin: 15px 0;
              }
              .feature-list li {
                color: #555;
                padding: 8px 0;
                padding-left: 25px;
                position: relative;
              }
              .feature-list li:before {
                content: "✓";
                position: absolute;
                left: 0;
                color: #28a745;
                font-weight: bold;
              }
              .cta-button {
                display: inline-block;
                background-color: #667eea;
                color: white;
                padding: 14px 35px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: 600;
                margin: 20px 0;
                transition: background-color 0.3s ease;
              }
              .cta-button:hover {
                background-color: #764ba2;
              }
              .benefits-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin: 20px 0;
              }
              .benefit-card {
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                border-left: 4px solid #667eea;
              }
              .benefit-card h4 {
                color: #667eea;
                margin-top: 0;
                margin-bottom: 8px;
                font-size: 14px;
              }
              .benefit-card p {
                margin: 0;
                color: #666;
                font-size: 13px;
              }
              .footer {
                background-color: #f5f5f5;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
                color: #888;
              }
              .divider {
                border-top: 1px solid #e0e0e0;
                margin: 25px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="header">
                <h1>🏠 Welcome to Grihastha</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your Gateway to Property Hosting Success</p>
              </div>

              <!-- Content -->
              <div class="content">
                <div class="greeting">
                  Hi <strong>${hostName}</strong>,
                </div>

                <p>
                  We're thrilled to have you join the Grihastha community! Your account has been successfully created, and you're now ready to start your hosting journey.
                </p>

                <!-- Key Benefits -->
                <div class="section">
                  <h3>What You Can Do Now:</h3>
                  <ul class="feature-list">
                    <li>Create and manage your property listings</li>
                    <li>Set your own pricing and availability</li>
                    <li>Receive and manage booking requests</li>
                    <li>Build your reputation with guest reviews</li>
                    <li>Earn money from your properties</li>
                  </ul>
                </div>

                <!-- Benefits Grid -->
                <div class="benefits-grid">
                  <div class="benefit-card">
                    <h4>🎯 Easy Setup</h4>
                    <p>Create your first listing in just a few minutes</p>
                  </div>
                  <div class="benefit-card">
                    <h4>💰 Earn Money</h4>
                    <p>Competitive rates and flexible payment options</p>
                  </div>
                  <div class="benefit-card">
                    <h4>🛡️ Secure Platform</h4>
                    <p>Your data is protected with enterprise-level security</p>
                  </div>
                  <div class="benefit-card">
                    <h4>📞 24/7 Support</h4>
                    <p>Our team is always here to help you succeed</p>
                  </div>
                </div>

                <div class="divider"></div>

                <!-- Next Steps -->
                <div class="section">
                  <h3>Getting Started:</h3>
                  <p><strong>1. Complete Your Profile</strong><br>Add a profile picture and bio to build trust with guests</p>
                  <p><strong>2. List Your Property</strong><br>Provide details, photos, and pricing for your property</p>
                  <p><strong>3. Set House Rules</strong><br>Define your expectations and policies for guests</p>
                  <p><strong>4. Get Verified</strong><br>Complete identity verification to increase bookings</p>
                </div>

                <!-- CTA Button -->
                <center>
                  <a href="${process.env.CLIENT_URL}/host/dashboard" class="cta-button">Go to Host Dashboard</a>
                </center>

                <!-- Support Section -->
                <div class="section">
                  <h3>Need Help?</h3>
                  <p>Check out our <strong>Host Guides</strong> and <strong>FAQs</strong> in your dashboard, or contact our support team anytime. We're here to help you succeed!</p>
                </div>

                <div class="divider"></div>

                <p style="font-size: 14px; color: #666;">
                  Happy hosting!<br>
                  <strong>The Grihastha Team</strong>
                </p>
              </div>

              <!-- Footer -->
              <div class="footer">
                <p style="margin: 0;">
                  © 2026 Grihastha. All rights reserved.<br>
                  You're receiving this email because you registered as a host on Grihastha.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending host welcome email:", error);
    throw error;
  }
};

/**
 * Send booking confirmation email to guests after successful payment.
 * @param {string} email - Recipient email address
 * @param {Object} bookingData - Booking details
 * @returns {Promise<void>}
 */
export const sendBookingConfirmationEmail = async (email, bookingData) => {
  if (!transporter) {
    console.warn("[WARN] Email transporter not configured, skipping booking confirmation email");
    return;
  }
  try {
    const { guest_name, listing_title, check_in, check_out, total_amount, booking_id, host_phone } = bookingData;
    
    // Default basic rules if not provided
    const basicRules = `
      <ul style="margin-top: 5px; padding-left: 20px;">
        <li>No smoking inside the property.</li>
        <li>Quiet hours are from 10:00 PM to 7:00 AM.</li>
        <li>No unauthorized parties or events.</li>
        <li>Please keep the property clean and tidy.</li>
      </ul>
    `;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Booking Confirmed: ${listing_title} on Grihastha`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f7f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: #0b8e72; margin-top: 0;">Booking Confirmed! 🎉</h1>
            </div>
            
            <p>Hi <strong>${guest_name}</strong>,</p>
            <p>Great news! Your booking and payment for <strong>${listing_title}</strong> have been successfully processed.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #0b8e72;">
              <h3 style="margin-top: 0; color: #0b8e72;">Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Confirmation Code:</strong> ${booking_id}</p>
              <p style="margin: 5px 0;"><strong>Check-in:</strong> ${new Date(check_in).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Check-out:</strong> ${new Date(check_out).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Total Paid:</strong> NPR ${total_amount}</p>
              <p style="margin: 5px 0;"><strong>Host Phone:</strong> ${host_phone || 'Not provided'}</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #f59e0b;">Host's Basic Rules</h3>
              ${basicRules}
            </div>
            
            <p>You can view your trip details, message your host, or find directions directly in your Grihastha account.</p>
            
            <center>
              <a href="${process.env.CLIENT_URL}/bookings" style="display: inline-block; background-color: #0b8e72; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">View My Trips</a>
            </center>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 13px; color: #888; text-align: center;">
              Thank you for choosing Grihastha!<br>
              © 2026 Grihastha Platform
            </p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    // Don't throw, we don't want to crash the payment verification if email fails
  }
};

/**
 * Send new booking email to hosts after a guest successfully pays.
 * @param {string} email - Recipient email address (host)
 * @param {Object} bookingData - Booking details
 * @returns {Promise<void>}
 */
export const sendHostNewBookingEmail = async (email, bookingData) => {
  if (!transporter) {
    console.warn("[WARN] Email transporter not configured, skipping new booking email to host");
    return;
  }
  try {
    const { host_name, guest_name, listing_title, check_in, check_out, total_amount, booking_id } = bookingData;
    
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Booking Confirmed: ${listing_title} (Auto-Confirmed)`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f7f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: #667eea; margin-top: 0;">You have a new booking! 🥳</h1>
              <p style="color: #28a745; font-weight: bold; margin-top: 5px;">Payment received & Booking auto-confirmed</p>
            </div>
            
            <p>Hi <strong>${host_name}</strong>,</p>
            <p>Great news! <strong>${guest_name}</strong> just paid for a stay at <strong>${listing_title}</strong>. Since the payment was successful, the booking has been <strong>automatically confirmed</strong> in your calendar.</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <h3 style="margin-top: 0; color: #667eea;">Booking Details</h3>
              <p style="margin: 5px 0;"><strong>Confirmation Code:</strong> ${booking_id}</p>
              <p style="margin: 5px 0;"><strong>Guest Name:</strong> ${guest_name}</p>
              <p style="margin: 5px 0;"><strong>Check-in:</strong> ${new Date(check_in).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Check-out:</strong> ${new Date(check_out).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Total Earned:</strong> NPR ${total_amount}</p>
            </div>
            
            <p>No further action is required from your side. You can view the full details on your Host Dashboard.</p>
            
            <center>
              <a href="${process.env.CLIENT_URL}/vendor" style="display: inline-block; background-color: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">Go to Dashboard</a>
            </center>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 13px; color: #888; text-align: center;">
              Happy hosting!<br>
              © 2026 Grihastha Platform
            </p>
          </body>
        </html>
      `,
    });
  } catch (error) {
    console.error("Error sending host new booking email:", error);
  }
};

/**
 * Send booking rejection email to guest when host declines.
 */
export const sendBookingRejectionEmail = async (email, data) => {
  if (!transporter) return;
  try {
    const { guest_name, listing_title, reason } = data;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Booking Request Declined: ${listing_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d9534f;">Booking Request Declined</h2>
          <p>Hi <strong>${guest_name}</strong>,</p>
          <p>Unfortunately, the host has declined your booking request for <strong>${listing_title}</strong>.</p>
          ${reason ? `<div style="background: #fdf7f7; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>Reason from host:</strong><br/>${reason}</div>` : ""}
          <p>No worries! You can browse other properties and find another great place to stay.</p>
          <a href="${process.env.CLIENT_URL}/home" style="display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Browse More Properties</a>
        </div>
      `,
    });
  } catch (error) { console.error("Error sending rejection email:", error); }
};

/**
 * Send cancellation email to guest when host cancels.
 */
export const sendHostCancellationEmailToGuest = async (email, data) => {
  if (!transporter) return;
  try {
    const { guest_name, listing_title, reason, booking_id } = data;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `URGENT: Booking Cancelled - ${listing_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #d9534f;">Your Booking was Cancelled by the Host</h2>
          <p>Hi <strong>${guest_name}</strong>,</p>
          <p>We're sorry to inform you that your booking (${booking_id}) for <strong>${listing_title}</strong> has been cancelled by the host.</p>
          ${reason ? `<div style="background: #fdf7f7; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>Reason:</strong><br/>${reason}</div>` : ""}
          <p>If you were already charged, a refund is being processed according to our cancellation policy.</p>
          <p>Please contact our support team if you need help finding alternative accommodation.</p>
        </div>
      `,
    });
  } catch (error) { console.error("Error sending host cancellation email:", error); }
};

/**
 * Send cancellation notification to host when guest cancels.
 */
export const sendGuestCancellationEmailToHost = async (email, data) => {
  if (!transporter) return;
  try {
    const { host_name, guest_name, listing_title, reason, booking_id } = data;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Booking Cancelled by Guest: ${listing_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #f0ad4e;">Trip Cancelled by Guest</h2>
          <p>Hi <strong>${host_name}</strong>,</p>
          <p>Guest <strong>${guest_name}</strong> has cancelled their booking (${booking_id}) for <strong>${listing_title}</strong>.</p>
          ${reason ? `<div style="background: #fff8f0; padding: 15px; border-radius: 5px; margin: 15px 0;"><strong>Reason provided:</strong><br/>${reason}</div>` : ""}
          <p>Your property dates are now reopened and available for other guests to book.</p>
          <a href="${process.env.CLIENT_URL}/host/dashboard" style="display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">View Dashboard</a>
        </div>
      `,
    });
  } catch (error) { console.error("Error sending guest cancellation email to host:", error); }
};

/**
 * Send cancellation confirmation to guest.
 */
export const sendGuestCancellationEmailToGuest = async (email, data) => {
  if (!transporter) return;
  try {
    const { guest_name, listing_title, booking_id } = data;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Cancellation Confirmed: ${listing_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2>Your Cancellation is Confirmed</h2>
          <p>Hi <strong>${guest_name}</strong>,</p>
          <p>You have successfully cancelled your booking (${booking_id}) for <strong>${listing_title}</strong>.</p>
          <p>We hope to see you on another trip soon!</p>
        </div>
      `,
    });
  } catch (error) { console.error("Error sending cancellation confirmation to guest:", error); }
};
