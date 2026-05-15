import { query } from "../config/db.js";
import { sendKycApprovalEmail, sendKycRejectionEmail } from "../utils/mailer.js";
import { deleteImage } from "../config/cloudinary.js";

export const getGeneralDashboard = async (req, res) => {
  try {
    const stats = {};

    // Total platform GMV
    const gmvQuery = await query(
      "SELECT COALESCE(SUM(total_price), 0)::int as gmv FROM bookings WHERE status IN ('confirmed', 'completed')",
    );
    stats.total_gmv = gmvQuery.rows[0].gmv;

    // User counts
    const usersQuery = await query("SELECT COUNT(*)::int as total FROM users");
    stats.total_users = usersQuery.rows[0].total;

    const hostQuery = await query(
      "SELECT COUNT(*)::int as total FROM users WHERE is_host = TRUE",
    );
    stats.total_hosts = hostQuery.rows[0].total;

    // Listing counts
    const listingsQuery = await query(
      "SELECT COUNT(*)::int as total FROM listings",
    );
    stats.total_listings = listingsQuery.rows[0].total;

    const publishedListingsQuery = await query(
      "SELECT COUNT(*)::int as total FROM listings WHERE status = 'PUBLISHED'",
    );
    stats.published_listings = publishedListingsQuery.rows[0].total;

    // Pending KYC
    const pendingKycQuery = await query(
      "SELECT COUNT(*)::int as total FROM kyc_documents WHERE status = 'under_review'",
    );
    stats.pending_kyc = pendingKycQuery.rows[0].total;

    // Recent bookings (last 5)
    const recentQueries = await query(
      `SELECT b.id, b.check_in, b.check_out, b.status, b.created_at, l.title as listing_title, 
              (b.price_breakdown->>'total')::int as total_price
       FROM bookings b JOIN listings l ON b.listing_id = l.id 
       ORDER BY b.created_at DESC LIMIT 5`,
    );
    stats.recent_bookings = recentQueries.rows;

    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPendingKyc = async (req, res) => {
  try {
    const result = await query(
      `SELECT k.*, l.title as listing_title, u.full_name as host_name, u.email as host_email 
       FROM kyc_documents k
       LEFT JOIN listings l ON k.listing_id = l.id
       JOIN users u ON k.host_id = u.id
       WHERE k.status = 'under_review'
       ORDER BY k.created_at ASC`,
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveKyc = async (req, res) => {
  try {
    const { id: verificationId } = req.params;
    const adminId = req.user.sub;

    // Update KYC status
    const result = await query(
      "UPDATE kyc_documents SET status = 'APPROVED', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2 RETURNING host_id",
      [adminId, verificationId],
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "KYC not found" });

    // Mark user as verified
    await query(
      "UPDATE users SET is_verified = TRUE, kyc_status = 'approved' WHERE id = $1",
      [result.rows[0].host_id],
    );

    // Create in-app notification for host
    await query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, $2, $3, $4)`,
      [
        result.rows[0].host_id,
        "KYC Approved",
        "Your KYC verification has been approved! You are now a verified host.",
        "success"
      ]
    );

    // Fetch user details for email
    const userResult = await query("SELECT email, full_name FROM users WHERE id = $1", [result.rows[0].host_id]);
    if (userResult.rows.length > 0) {
      const { email, full_name } = userResult.rows[0];
      await sendKycApprovalEmail(email, full_name);
    }

    res.json({ success: true, message: "KYC approved. Host verified." });
  } catch (err) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('error.log', `[APPROVE Error] ${err.stack}\n`);
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  const publicIdParts = parts.slice(uploadIndex + 2);
  const publicIdWithExt = publicIdParts.join('/');
  const publicId = publicIdWithExt.split('.')[0];
  return publicId;
};

export const rejectKyc = async (req, res) => {
  try {
    const { id: verificationId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.sub;

    // Fetch documents to delete from Cloudinary
    const kycResult = await query("SELECT documents, host_id FROM kyc_documents WHERE id = $1", [verificationId]);
    if (kycResult.rows.length === 0)
      return res.status(404).json({ success: false, message: "KYC not found" });

    const { documents, host_id } = kycResult.rows[0];

    // Delete images from Cloudinary
    if (documents) {
      for (const key in documents) {
        const doc = documents[key];
        if (doc.url) {
          const publicId = getPublicIdFromUrl(doc.url);
          if (publicId) {
            try {
              await deleteImage(publicId);
            } catch (err) {
              console.error(`Failed to delete image ${publicId}:`, err);
            }
          }
        }
      }
    }

    // Update KYC status and remove URLs to clear storage reference
    const updatedDocuments = { ...documents };
    for (const key in updatedDocuments) {
      if (updatedDocuments[key].url) updatedDocuments[key].url = '';
    }

    await query(
      "UPDATE kyc_documents SET status = 'REJECTED', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW(), documents = $3 WHERE id = $4",
      [reason || "No reason provided", adminId, updatedDocuments, verificationId],
    );

    await query("UPDATE users SET kyc_status = 'rejected' WHERE id = $1", [
      host_id,
    ]);

    // Create in-app notification for host
    await query(
      `INSERT INTO notifications (user_id, title, message, type) 
       VALUES ($1, $2, $3, $4)`,
      [
        host_id,
        "KYC Rejected",
        `Your KYC verification was rejected. Reason: ${reason || "No reason provided"}`,
        "alert"
      ]
    );

    // Fetch user details for email
    const userResult = await query("SELECT email, full_name FROM users WHERE id = $1", [host_id]);
    if (userResult.rows.length > 0) {
      const { email, full_name } = userResult.rows[0];
      await sendKycRejectionEmail(email, full_name, reason);
    }

    res.json({ success: true, message: "KYC rejected." });
  } catch (err) {
    try {
      const fs = await import('fs');
      fs.appendFileSync('error.log', `[REJECT Error] ${err.stack}\n`);
    } catch (logErr) {
      console.error('Failed to log error:', logErr);
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- STUBS FOR FULL PROTOTYPE COMPLETION ---
export const getRevenueAnalytics = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const getListingAnalytics = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const getUserAnalytics = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const getUsers = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const getUserDetail = async (req, res) => {
  res.json({ success: true, data: { id: req.params.id } });
};
export const suspendUser = async (req, res) => {
  res.json({ success: true, message: "User suspended" });
};
export const deleteUser = async (req, res) => {
  res.json({ success: true, message: "User deleted" });
};
export const getHosts = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const verifyHost = async (req, res) => {
  res.json({ success: true, message: "Host verified" });
};
export const suspendHost = async (req, res) => {
  res.json({ success: true, message: "Host suspended" });
};
export const getKycDocuments = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const getListingsAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT l.*, u.full_name as host_name, 
              kd.documents as kyc_docs,
              kd.status as kd_status,
              kd.rejection_reason as kd_rejection_reason
       FROM listings l
       JOIN users u ON l.host_id = u.id
       LEFT JOIN kyc_documents kd ON l.id = kd.listing_id
       ORDER BY l.created_at DESC`
    );

    const properties = result.rows.map(row => {
      let legalDocUrl = null;
      if (row.kyc_docs) {
        try {
          const docs = typeof row.kyc_docs === 'string' ? JSON.parse(row.kyc_docs) : row.kyc_docs;
          const keys = Object.keys(docs);
          if (keys.length > 0) {
            const bestKey = keys.find(k => k === 'propDoc' || k === 'document') || keys[0];
            legalDocUrl = docs[bestKey]?.url;
          }
        } catch (e) {
          console.error("Failed to parse kyc_docs JSON:", e);
        }
      }

      return {
        ...row,
        legalDocUrl: legalDocUrl,
        legalDocName: legalDocUrl ? 'Ownership Certificate' : null,
        approvalStatus: row.kd_status ? row.kd_status.toLowerCase() : 'pending',
        rejectionReason: row.kd_rejection_reason
      };
    });

    res.json({ success: true, data: properties });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const approveListingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE listings SET status = 'PUBLISHED', updated_at = NOW()
       WHERE id = $1 AND status = 'DRAFT'
       RETURNING id, title, status, host_id`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Listing not found or already published" });
    }

    const listing = result.rows[0];
    
    // Insert notification for the host
    await query(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)`,
      [
        listing.host_id,
        "Property Approved ✅",
        `Your property "${listing.title}" has been approved and is now visible to guests!`,
        "listing",
      ]
    );

    res.json({ success: true, message: "Listing approved and published" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const suspendListing = async (req, res) => {
  res.json({ success: true, message: "Listing suspended" });
};
export const deleteListingAdmin = async (req, res) => {
  res.json({ success: true, message: "Listing deleted" });
};
export const getReviewsAdmin = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const deleteReviewAdmin = async (req, res) => {
  res.json({ success: true, message: "Review deleted" });
};
export const getFeeConfig = async (req, res) => {
  res.json({ success: true, data: { guestFee: 14, hostFee: 3 } });
};
export const updateFeeConfig = async (req, res) => {
  res.json({ success: true, message: "Fee updated" });
};
export const addCustomFeeRule = async (req, res) => {
  res.json({ success: true, message: "Rule added" });
};
export const getDisputes = async (req, res) => {
  try {
    const result = await query(
      `SELECT c.id as conversation_id, c.created_at,
              u.full_name as guest_name, u.email as guest_email,
              (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c
       JOIN users u ON c.guest_id = u.id
       WHERE c.host_id IS NULL
       ORDER BY c.created_at DESC`
    );
    
    // Map them to look like disputes so the frontend doesn't break
    const data = result.rows.map(row => ({
      dispute_id: row.conversation_id, // Use conversation_id as dispute_id
      reason: row.last_message || 'Contact Support',
      status: 'OPEN',
      created_at: row.created_at,
      guest_name: row.guest_name,
      guest_email: row.guest_email,
      conversation_id: row.conversation_id
    }));
    
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getDisputeDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT d.id as dispute_id, d.booking_id, d.reason, d.status, d.created_at,
              u.full_name as guest_name, u.email as guest_email,
              l.title as listing_title,
              c.id as conversation_id
       FROM disputes d
       JOIN users u ON d.raised_by = u.id
       JOIN bookings b ON d.booking_id = b.id
       JOIN listings l ON b.listing_id = l.id
       LEFT JOIN conversations c ON c.guest_id = d.raised_by AND c.host_id IS NULL
       WHERE d.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Dispute not found" });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
export const resolveDispute = async (req, res) => {
  res.json({ success: true, message: "Dispute resolved" });
};
export const updateDisputeStatus = async (req, res) => {
  res.json({ success: true, message: "Status updated" });
};
export const getTaxRules = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const addTaxRule = async (req, res) => {
  res.json({ success: true, message: "Tax rule added" });
};
export const updateTaxRule = async (req, res) => {
  res.json({ success: true, message: "Tax rule updated" });
};
export const deleteTaxRule = async (req, res) => {
  res.json({ success: true, message: "Tax rule deleted" });
};
export const getPlatformPayments = async (req, res) => {
  res.json({ success: true, data: [] });
};
export const getPaymentDetail = async (req, res) => {
  res.json({ success: true, data: { id: req.params.id } });
};
export const triggerPayout = async (req, res) => {
  res.json({ success: true, message: "Payout triggered" });
};
export const getAdminPayouts = async (req, res) => {
  res.json({ success: true, data: [] });
};

