import { query } from "../config/db.js";

// POST /v1/host/property-verification/:listingId
export const submitPropertyVerification = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { listingId } = req.params;
    const { 
      ownership_type, 
      ward_number, 
      municipality, 
      province, 
      district, 
      property_reg_number,
      notes 
    } = req.body;

    // Verify ownership
    const ownerCheck = await query("SELECT id FROM listings WHERE id = $1 AND host_id = $2", [listingId, hostId]);
    if (ownerCheck.rows.length === 0) return res.status(403).json({ success: false, message: "Unauthorized or listing not found" });

    // Assuming files are uploaded to Cloudinary via middleware and URLs are attached to req.files
    // For this implementation, we simulate the URLs using file original names
    const docUrls = {};
    if (req.files) {
      if (Array.isArray(req.files)) {
         req.files.forEach(f => {
            docUrls[f.fieldname] = { url: `https://dummy/url/${f.originalname}`, status: 'submitted' };
         });
      } else {
         Object.keys(req.files).forEach(key => {
            docUrls[key] = { url: `https://dummy/url/${req.files[key][0].originalname}`, status: 'submitted' };
         });
      }
    }

    const documentsJSON = JSON.stringify(docUrls);

    const result = await query(
      `INSERT INTO kyc_documents (
        listing_id, host_id, ownership_type, ward_number, municipality, province, district, property_reg_number, 
        notes, documents, status, estimated_review_by
       ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'under_review', NOW() + INTERVAL '3 days')
       ON CONFLICT (listing_id) DO UPDATE 
       SET documents = $10, status = 'under_review', updated_at = NOW()
       RETURNING id as verification_id, status, created_at as submitted_at, estimated_review_by`,
      [listingId, hostId, ownership_type, ward_number, municipality, province, district, property_reg_number, notes, documentsJSON]
    );

    res.status(201).json({
      success: true,
      message: "Documents submitted. Admin will review within 2–3 business days.",
      verification_id: result.rows[0].verification_id,
      listing_id: listingId,
      status: result.rows[0].status,
      submitted_at: result.rows[0].submitted_at,
      estimated_review_by: result.rows[0].estimated_review_by
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /v1/host/property-verification/:listingId
export const getPropertyVerificationStatus = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { listingId } = req.params;

    const result = await query(
      `SELECT id as verification_id, listing_id, status, created_at as submitted_at, 
              reviewed_at, admin_notes, rejection_reason, documents
       FROM kyc_documents 
       WHERE listing_id = $1 AND host_id = $2`,
      [listingId, hostId]
    );

    if (result.rows.length === 0) return res.status(404).json({ success: false, message: "No verification found" });

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
