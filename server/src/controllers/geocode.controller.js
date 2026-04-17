/**
 * Search for locations using Nominatim (OpenStreetMap)
 * GET /v1/geocode/search?q=query&countrycodes=np
 */
export const searchLocation = async (req, res) => {
  try {
    const { q: query, countrycodes = "np" } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Query must be at least 2 characters",
        data: [],
      });
    }

    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
    nominatimUrl.searchParams.append("q", query);
    nominatimUrl.searchParams.append("format", "json");
    nominatimUrl.searchParams.append("limit", "10");
    if (countrycodes) {
      nominatimUrl.searchParams.append("countrycodes", countrycodes);
    }

    console.log(`[GEOCODE] Searching: "${query}" in country: ${countrycodes}`);

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "Grihastha/1.0.0 (https://github.com/piyushrauniyar/grihastha)",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    });

    // Handle rate limiting more gracefully
    if (response.status === 429) {
      console.warn(`[GEOCODE] Rate limited by Nominatim`);
      return res.status(200).json({
        success: false,
        message: "Geocoding service temporarily unavailable (rate limited)",
        data: [],
      });
    }

    if (response.status === 403) {
      console.warn(`[GEOCODE] Access denied by Nominatim`);
      return res.status(200).json({
        success: false,
        message: "Geocoding service temporarily unavailable",
        data: [],
      });
    }

    if (!response.ok) {
      console.error(`[GEOCODE] Nominatim error: ${response.status}`);
      return res.status(200).json({
        success: false,
        message: `Geocoding service error: ${response.status}`,
        data: [],
      });
    }

    const data = await response.json();

    console.log(`[GEOCODE] Found ${data.length} results for "${query}"`);

    return res.status(200).json({
      success: true,
      message: "Location search successful",
      data: data,
    });
  } catch (error) {
    console.error("[GEOCODE] Search error:", error.message);
    return res.status(200).json({
      success: false,
      message: "Failed to search location. Try clicking on the map instead.",
      data: [],
    });
  }
};
