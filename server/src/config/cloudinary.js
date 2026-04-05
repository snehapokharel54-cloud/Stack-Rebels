import { createRequire } from "module";
import { Readable } from "stream";

// Use createRequire to load cloudinary as CJS — ESM `import` of cloudinary
// hangs intermittently on Node.js because it's a pure CommonJS package.
const require = createRequire(import.meta.url);
const cloudinaryPkg = require("cloudinary");
const cloudinary = cloudinaryPkg.v2;

// Only configure if credentials are provided (skip placeholder values)
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured =
  cloudName &&
  apiKey &&
  apiSecret &&
  cloudName !== "your-cloud-name" &&
  apiKey !== "your-api-key" &&
  apiSecret !== "your-api-secret";

if (isConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
} else {
  console.warn(
    "[WARN] Cloudinary credentials not configured — image uploads will be disabled."
  );
}

/**
 * Upload an image to Cloudinary.
 * @param {string|Buffer} source - Local file path, URL, or Buffer to upload
 * @param {object} options - Optional upload options (folder, transformation, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadImage = async (source, options = {}) => {
  if (!isConfigured) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file."
    );
  }

  return new Promise((resolve, reject) => {
    if (Buffer.isBuffer(source)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "grihastha",
          resource_type: "image",
          ...options,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      Readable.from(source).pipe(uploadStream);
    } else {
      cloudinary.uploader.upload(
        source,
        {
          folder: "grihastha",
          resource_type: "image",
          ...options,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    }
  });
};

/**
 * Delete an image from Cloudinary by public ID.
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteImage = async (publicId) => {
  if (!isConfigured) {
    throw new Error("Cloudinary is not configured.");
  }

  const result = await cloudinary.uploader.destroy(publicId);
  return result;
};

export { cloudinary, uploadImage, deleteImage, isConfigured };
export default cloudinary;
