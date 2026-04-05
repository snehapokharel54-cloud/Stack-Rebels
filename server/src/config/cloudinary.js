import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload an image to Cloudinary.
 * @param {string} filePath - Local file path or URL to upload
 * @param {object} options - Optional upload options (folder, transformation, etc.)
 * @returns {Promise<object>} Cloudinary upload result
 */
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "grihastha",
      resource_type: "image",
      ...options,
    });
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Delete an image from Cloudinary by public ID.
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Cloudinary deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

export { cloudinary, uploadImage, deleteImage };
export default cloudinary;
