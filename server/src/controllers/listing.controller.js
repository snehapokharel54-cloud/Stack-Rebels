import { query } from "../config/db.js";
import { uploadImage } from "../config/cloudinary.js";

export const createListing = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const result = await query(
      `INSERT INTO listings (host_id, status) VALUES ($1, 'DRAFT')
       RETURNING id as listing_id, host_id, status, created_at`,
      [hostId]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getListing = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT l.*, u.full_name as host_name, u.avatar_url as host_avatar
       FROM listings l
       JOIN users u ON l.host_id = u.id
       WHERE l.id = $1`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Listing not found" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateListing = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id } = req.params;
    const { title, description, category, address, floor_plan, amenities, price_per_night, cleaning_fee } = req.body;

    const result = await query(
      `UPDATE listings SET
         title = COALESCE($3, title),
         description = COALESCE($4, description),
         category = COALESCE($5, category),
         address = COALESCE($6::jsonb, address),
         floor_plan = COALESCE($7::jsonb, floor_plan),
         amenities = COALESCE($8::jsonb, amenities),
         price_per_night = COALESCE($9, price_per_night),
         cleaning_fee = COALESCE($10, cleaning_fee),
         updated_at = NOW()
       WHERE id = $1 AND host_id = $2
       RETURNING *`,
      [id, hostId, title, description, category,
       address ? JSON.stringify(address) : null,
       floor_plan ? JSON.stringify(floor_plan) : null,
       amenities ? JSON.stringify(amenities) : null,
       price_per_night, cleaning_fee]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Listing not found or unauthorized" });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const publishListing = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id } = req.params;

    // Validate required fields
    const listing = await query(`SELECT title, price_per_night FROM listings WHERE id = $1 AND host_id = $2`, [id, hostId]);
    if (listing.rows.length === 0) return res.status(404).json({ success: false, message: "Not found" });
    if (!listing.rows[0].title) return res.status(400).json({ success: false, message: "Title is required to publish" });
    if (!listing.rows[0].price_per_night) return res.status(400).json({ success: false, message: "Price is required to publish" });

    const result = await query(
      `UPDATE listings SET status = 'PUBLISHED', updated_at = NOW()
       WHERE id = $1 AND host_id = $2 AND status = 'DRAFT'
       RETURNING id, status`,
      [id, hostId]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ success: false, message: "Already published or not found" });
    res.json({ success: true, message: "Listing published!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const searchListings = async (req, res) => {
  try {
    const { location, category, minPrice, maxPrice, sortBy, limit = 20, offset = 0 } = req.query;

    let sql = `SELECT l.*, u.full_name as host_name, u.avatar_url as host_avatar,
                      COALESCE(AVG(r.rating), 0) as average_rating,
                      COUNT(r.id) as review_count
               FROM listings l
               JOIN users u ON l.host_id = u.id
               LEFT JOIN reviews r ON l.id = r.property_id
               WHERE l.status = 'PUBLISHED'`;
    const params = [];

    if (location) {
      params.push(`%${location}%`);
      sql += ` AND (l.address->>'city' ILIKE $${params.length} OR l.address->>'province' ILIKE $${params.length} OR l.title ILIKE $${params.length})`;
    }
    if (category) {
      params.push(category);
      sql += ` AND l.category = $${params.length}`;
    }
    if (minPrice) {
      params.push(minPrice);
      sql += ` AND l.price_per_night >= $${params.length}`;
    }
    if (maxPrice) {
      params.push(maxPrice);
      sql += ` AND l.price_per_night <= $${params.length}`;
    }

    sql += ` GROUP BY l.id, u.full_name, u.avatar_url, l.created_at, l.price_per_night`;

    if (sortBy === 'price_low') sql += ` ORDER BY l.price_per_night ASC`;
    else if (sortBy === 'price_high') sql += ` ORDER BY l.price_per_night DESC`;
    else if (sortBy === 'rating') sql += ` ORDER BY average_rating DESC`;
    else sql += ` ORDER BY l.created_at DESC`;

    params.push(limit);
    sql += ` LIMIT $${params.length}`;
    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);

    // Total count for pagination
    let countSql = `SELECT COUNT(DISTINCT l.id) FROM listings l WHERE l.status = 'PUBLISHED'`;
    const countParams = [];
    if (location) { countParams.push(`%${location}%`); countSql += ` AND (l.address->>'city' ILIKE $${countParams.length} OR l.title ILIKE $${countParams.length})`; }
    if (category) { countParams.push(category); countSql += ` AND l.category = $${countParams.length}`; }
    const countRes = await query(countSql, countParams);
    const total = parseInt(countRes.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: { total, limit: +limit, offset: +offset, hasMore: +offset + +limit < total },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHostListings = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { status } = req.query;

    let sql = `SELECT * FROM listings WHERE host_id = $1`;
    const params = [hostId];
    if (status) { params.push(status); sql += ` AND status = $${params.length}`; }
    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    res.json({ success: true, data: { listings: result.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteListing = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id } = req.params;
    const result = await query(
      `DELETE FROM listings WHERE id = $1 AND host_id = $2 RETURNING id`,
      [id, hostId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: "Not found or unauthorized" });
    res.json({ success: true, message: "Listing deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const uploadListingPhotos = async (req, res) => {
  try {
    const hostId = req.user.sub;
    const { id } = req.params;

    // Check ownership
    const listing = await query(`SELECT id FROM listings WHERE id = $1 AND host_id = $2`, [id, hostId]);
    if (listing.rows.length === 0)
      return res.status(404).json({ success: false, message: "Not found" });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ success: false, message: "No photos uploaded" });

    // Upload each buffer to Cloudinary
    const uploadPromises = req.files.map(async (f, i) => {
      const result = await uploadImage(f.buffer, { folder: "grihastha/listings" });
      return {
        url: result.secure_url,
        public_id: result.public_id,
        position: i,
      };
    });

    const photos = await Promise.all(uploadPromises);

    // Append to existing photos
    await query(
      `UPDATE listings SET photos = COALESCE(photos, '[]'::jsonb) || $2::jsonb, updated_at = NOW()
       WHERE id = $1`,
      [id, JSON.stringify(photos)]
    );

    res.json({ success: true, data: photos, message: `${photos.length} photos uploaded` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
