import { Router } from "express";
import { verifyHost } from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";
import { uploadMedia } from "../controllers/media.controller.js";

const router = Router();

/**
 * POST /v1/media/upload
 * Upload a property image to Cloudinary
 */
router.post("/upload", verifyHost, upload.single("file"), uploadMedia);

export default router;
