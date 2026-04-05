import { Router } from "express";
import { searchLocation } from "../controllers/geocode.controller.js";

const router = Router();

/**
 * GET /v1/geocode/search
 * Search for locations using Nominatim
 */
router.get("/search", searchLocation);

export default router;
