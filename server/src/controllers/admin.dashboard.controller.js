import { query } from "../config/db.js";

export const getGeneralDashboard = async (req, res) => { 
  try {
    const stats = {};
    
    // Total platform GMV
    const gmvQuery = await query("SELECT COALESCE(SUM(total_price), 0)::int as gmv FROM bookings WHERE status IN ('confirmed', 'completed')");
    stats.total_gmv = gmvQuery.rows[0].gmv;

    // User counts
    const usersQuery = await query("SELECT COUNT(*)::int as total FROM users");
    stats.total_users = usersQuery.rows[0].total;

    const hostQuery = await query("SELECT COUNT(*)::int as total FROM users WHERE is_host = TRUE");
    stats.total_hosts = hostQuery.rows[0].total;

    // Listing counts
    const listingsQuery = await query("SELECT COUNT(*)::int as total FROM listings");
    stats.total_listings = listingsQuery.rows[0].total;

    const publishedListingsQuery = await query("SELECT COUNT(*)::int as total FROM listings WHERE status = 'PUBLISHED'");
    stats.published_listings = publishedListingsQuery.rows[0].total;

    // Pending KYC
    const pendingKycQuery = await query("SELECT COUNT(*)::int as total FROM kyc_documents WHERE status = 'under_review'");
    stats.pending_kyc = pendingKycQuery.rows[0].total;

    // Recent bookings (last 5)
    const recentQueries = await query(
      `SELECT b.id, b.check_in, b.check_out, b.status, b.created_at, l.title as listing_title, 
              (b.price_breakdown->>'total')::int as total_price
       FROM bookings b JOIN listings l ON b.listing_id = l.id 
       ORDER BY b.created_at DESC LIMIT 5`
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
       JOIN listings l ON k.listing_id = l.id
       JOIN users u ON k.host_id = u.id
       WHERE k.status = 'under_review'
       ORDER BY k.created_at ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const approveKyc = async (req, res) => { 
  try {
    const { id: verificationId } = req.params;
    const adminId = req.user.sub;
    
    // Update KYC status
    const result = await query(
      "UPDATE kyc_documents SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() WHERE id = $2 RETURNING host_id",
      [adminId, verificationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "KYC not found" });

    // Mark user as verified
    await query("UPDATE users SET is_verified = TRUE, kyc_status = 'approved' WHERE id = $1", [result.rows[0].host_id]);

    res.json({ success: true, message: "KYC approved. Host verified." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

export const rejectKyc = async (req, res) => { 
  try {
    const { id: verificationId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.sub;

    const result = await query(
      "UPDATE kyc_documents SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING host_id",
      [reason || 'No reason provided', adminId, verificationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "KYC not found" });

    await query("UPDATE users SET kyc_status = 'rejected' WHERE id = $1", [result.rows[0].host_id]);

    res.json({ success: true, message: "KYC rejected." });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// --- STUBS FOR FULL PROTOTYPE COMPLETION ---
export const getRevenueAnalytics = async (req, res) => { res.json({ success: true, data: [] }); };
export const getListingAnalytics = async (req, res) => { res.json({ success: true, data: [] }); };
export const getUserAnalytics = async (req, res) => { res.json({ success: true, data: [] }); };
export const getUsers = async (req, res) => { res.json({ success: true, data: [] }); };
export const getUserDetail = async (req, res) => { res.json({ success: true, data: { id: req.params.id } }); };
export const suspendUser = async (req, res) => { res.json({ success: true, message: 'User suspended' }); };
export const deleteUser = async (req, res) => { res.json({ success: true, message: 'User deleted' }); };
export const getHosts = async (req, res) => { res.json({ success: true, data: [] }); };
export const verifyHost = async (req, res) => { res.json({ success: true, message: 'Host verified' }); };
export const suspendHost = async (req, res) => { res.json({ success: true, message: 'Host suspended' }); };
export const getKycDocuments = async (req, res) => { res.json({ success: true, data: [] }); };
export const getListingsAdmin = async (req, res) => { res.json({ success: true, data: [] }); };
export const suspendListing = async (req, res) => { res.json({ success: true, message: 'Listing suspended' }); };
export const deleteListingAdmin = async (req, res) => { res.json({ success: true, message: 'Listing deleted' }); };
export const getReviewsAdmin = async (req, res) => { res.json({ success: true, data: [] }); };
export const deleteReviewAdmin = async (req, res) => { res.json({ success: true, message: 'Review deleted' }); };
export const getFeeConfig = async (req, res) => { res.json({ success: true, data: { guestFee: 14, hostFee: 3 } }); };
export const updateFeeConfig = async (req, res) => { res.json({ success: true, message: 'Fee updated' }); };
export const addCustomFeeRule = async (req, res) => { res.json({ success: true, message: 'Rule added' }); };
export const getDisputes = async (req, res) => { res.json({ success: true, data: [] }); };
export const getDisputeDetail = async (req, res) => { res.json({ success: true, data: { id: req.params.id } }); };
export const resolveDispute = async (req, res) => { res.json({ success: true, message: 'Dispute resolved' }); };
export const updateDisputeStatus = async (req, res) => { res.json({ success: true, message: 'Status updated' }); };
export const getTaxRules = async (req, res) => { res.json({ success: true, data: [] }); };
export const addTaxRule = async (req, res) => { res.json({ success: true, message: 'Tax rule added' }); };
export const updateTaxRule = async (req, res) => { res.json({ success: true, message: 'Tax rule updated' }); };
export const deleteTaxRule = async (req, res) => { res.json({ success: true, message: 'Tax rule deleted' }); };
export const getPlatformPayments = async (req, res) => { res.json({ success: true, data: [] }); };
export const getPaymentDetail = async (req, res) => { res.json({ success: true, data: { id: req.params.id } }); };
export const triggerPayout = async (req, res) => { res.json({ success: true, message: 'Payout triggered' }); };
export const getAdminPayouts = async (req, res) => { res.json({ success: true, data: [] }); };