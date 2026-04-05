/**
 * Geocode Controller
 * Handles location geocoding and address validation
 */

export const searchLocation = async (req, res) => {
  try {
    const { query } = req.query;
    res.json({ success: true, data: [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
