import { query } from "../config/db.js";

export const getEarnings = async (req, res) => {
  try {
    const hostId = req.user.sub;

    // Total earnings (paid bookings only)
    const earningsRes = await query(
      `SELECT COALESCE(SUM(b.total_price), 0) as total_earnings
       FROM bookings b WHERE b.host_id = $1 AND b.payment_status = 'paid'`,
      [hostId]
    );

    // Monthly revenue (paid bookings, last 12 months)
    const revenueRes = await query(
      `SELECT EXTRACT(MONTH FROM b.created_at)::int as month_num,
              TO_CHAR(b.created_at, 'Mon') as label,
              COALESCE(SUM(b.total_price), 0) as revenue
       FROM bookings b
       WHERE b.host_id = $1 AND b.payment_status = 'paid'
         AND b.created_at >= DATE_TRUNC('year', NOW())
       GROUP BY month_num, label
       ORDER BY month_num`,
      [hostId]
    );

    // Monthly booking count (all bookings, last 12 months)
    const bookingsRes = await query(
      `SELECT EXTRACT(MONTH FROM b.created_at)::int as month_num,
              TO_CHAR(b.created_at, 'Mon') as label,
              COUNT(*)::int as bookings
       FROM bookings b
       WHERE b.host_id = $1
         AND b.created_at >= DATE_TRUNC('year', NOW())
       GROUP BY month_num, label
       ORDER BY month_num`,
      [hostId]
    );

    // Build complete monthly array (Jan–Dec) filling gaps with 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = {};
    const bookingsMap = {};
    revenueRes.rows.forEach(r => { revenueMap[r.month_num] = Number(r.revenue) });
    bookingsRes.rows.forEach(r => { bookingsMap[r.month_num] = Number(r.bookings) });

    const currentMonth = new Date().getMonth() + 1; // 1-indexed
    const monthly_data = [];
    for (let m = 1; m <= currentMonth; m++) {
      monthly_data.push({
        label: monthNames[m - 1],
        revenue: revenueMap[m] || 0,
        bookings: bookingsMap[m] || 0,
      });
    }

    // Occupancy rate
    const totalListings = await query(
      `SELECT COUNT(*) FROM listings WHERE host_id = $1 AND status = 'PUBLISHED'`,
      [hostId]
    );
    const bookedListings = await query(
      `SELECT COUNT(DISTINCT listing_id) FROM bookings
       WHERE host_id = $1 AND status = 'CONFIRMED' AND check_out >= NOW()`,
      [hostId]
    );

    const total = parseInt(totalListings.rows[0].count) || 1;
    const booked = parseInt(bookedListings.rows[0].count) || 0;
    const occupancy = Math.round((booked / total) * 100);

    res.json({
      success: true,
      data: {
        total_earnings: Number(earningsRes.rows[0].total_earnings),
        occupancy_rate: occupancy,
        monthly_data,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const requestPayout = async (req, res) => {
  res.status(501).json({ success: false, message: "Payout requests coming soon." });
};

export const getPayoutHistory = async (req, res) => {
  res.json({ success: true, data: [] });
};

export const setupBankAccount = async (req, res) => {
  res.status(501).json({ success: false, message: "Bank account setup coming soon." });
};

export const getBankAccount = async (req, res) => {
  res.json({ success: true, data: null });
};
