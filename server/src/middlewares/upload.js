import multer from "multer";

/**
 * Multer configuration for handling file uploads
 * Stores files in memory before uploading to Cloudinary
 */
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // Only accept image files
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 10, // Max 10 files per request
  },
});

export default upload;
