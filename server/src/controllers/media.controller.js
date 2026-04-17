import { uploadImage } from "../config/cloudinary.js";

/**
 * Upload a media file (property image)
 * POST /v1/media/upload
 */
export const uploadMedia = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided.",
        errors: [{ field: "file", message: "File is required." }],
      });
    }

    const file = req.file;

    // Validate file type
    const allowedMimetypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimetypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        errors: [{ field: "file", message: "Unsupported image format." }],
      });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File size exceeds 5MB limit.",
        errors: [{ field: "file", message: "File is too large." }],
      });
    }

    // Upload to Cloudinary
    const uploadResult = await uploadImage(file.buffer, {
      folder: "grihastha/media",
      resource_type: "image",
      format: "webp", // Convert to WebP for optimization
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully.",
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        width: uploadResult.width,
        height: uploadResult.height,
      },
    });
  } catch (error) {
    console.error("Media upload error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to upload image.",
      errors: [],
    });
  }
};
