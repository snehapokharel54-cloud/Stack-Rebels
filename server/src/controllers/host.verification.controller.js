import { query } from "../config/db.js";
import { uploadImage } from "../config/cloudinary.js";

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
      notes,
    } = req.body;

    // Verify ownership if listingId is provided
    if (listingId) {
      const ownerCheck = await query(
        "SELECT id FROM listings WHERE id = $1 AND host_id = $2",
        [listingId, hostId],
      );
      if (ownerCheck.rows.length === 0)
        return res
          .status(403)
          .json({ success: false, message: "Unauthorized or listing not found" });
    }

    // Upload files to Cloudinary
    const docUrls = {};
    if (req.files) {
      const filesArray = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
      
      for (const f of filesArray) {
        try {
          const result = await uploadImage(f.buffer, { folder: "kyc_documents" });
          docUrls[f.fieldname] = {
            url: result.secure_url,
            status: "submitted",
          };
        } catch (uploadErr) {
          console.error(`Failed to upload ${f.fieldname}:`, uploadErr);
          return res.status(500).json({ success: false, message: `Failed to upload ${f.fieldname}` });
        }
      }
    }

    const documentsJSON = JSON.stringify(docUrls);

    let result;
    if (listingId) {
      result = await query(
        `INSERT INTO kyc_documents (
          listing_id, host_id, user_id, ownership_type, ward_number, municipality, province, district, property_reg_number, 
          notes, documents, status, estimated_review_by, document_url
         ) 
         VALUES ($1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'under_review', NOW() + INTERVAL '3 days', '')
         ON CONFLICT (listing_id) DO UPDATE 
         SET documents = $10, status = 'under_review', updated_at = NOW()
         RETURNING id as verification_id, status, created_at as submitted_at, estimated_review_by`,
        [
          listingId,
          hostId,
          ownership_type,
          ward_number,
          municipality,
          province,
          district,
          property_reg_number,
          notes,
          documentsJSON,
        ],
      );
    } else {
      const existing = await query(
        "SELECT id FROM kyc_documents WHERE host_id = $1 AND listing_id IS NULL",
        [hostId],
      );
      if (existing.rows.length > 0) {
        result = await query(
          `UPDATE kyc_documents 
           SET documents = $1, status = 'under_review', updated_at = NOW() 
           WHERE id = $2
           RETURNING id as verification_id, status, created_at as submitted_at, estimated_review_by`,
          [documentsJSON, existing.rows[0].id],
        );
      } else {
        result = await query(
          `INSERT INTO kyc_documents (
            host_id, user_id, ownership_type, ward_number, municipality, province, district, property_reg_number, 
            notes, documents, status, estimated_review_by, document_url
           ) 
           VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $9, 'under_review', NOW() + INTERVAL '3 days', '')
           RETURNING id as verification_id, status, created_at as submitted_at, estimated_review_by`,
          [
            hostId,
            ownership_type,
            ward_number,
            municipality,
            province,
            district,
            property_reg_number,
            notes,
            documentsJSON,
          ],
        );
      }
    }

    res.status(201).json({
      success: true,
      message:
        "Documents submitted. Admin will review within 2–3 business days.",
      verification_id: result.rows[0].verification_id,
      listing_id: listingId,
      status: result.rows[0].status,
      submitted_at: result.rows[0].submitted_at,
      estimated_review_by: result.rows[0].estimated_review_by,
    });
  } catch (err) {
    import('fs').then(fs => fs.appendFileSync('error.log', `[POST Submit Error] ${err.stack}\n`));
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
              reviewed_at, rejection_reason, documents
       FROM kyc_documents 
       WHERE (listing_id = $1 OR (listing_id IS NULL AND $1 IS NULL)) AND host_id = $2`,
      [listingId || null, hostId],
    );

    if (result.rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "No verification found" });

    res.json(result.rows[0]);
  } catch (err) {
    import('fs').then(fs => fs.appendFileSync('error.log', `[GET Status Error] ${err.stack}\n`));
    res.status(500).json({ success: false, message: err.message });
  }
};

