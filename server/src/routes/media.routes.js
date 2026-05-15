import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import upload from "../middlewares/upload.js";
import { uploadMedia } from "../controllers/media.controller.js";

const router = Router();

/**
 * POST /v1/media/upload
 * Upload a property image or avatar to Cloudinary
 */
router.post("/upload", authenticate, upload.single("file"), uploadMedia);

export default router;
