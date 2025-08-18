/**
 * sanitizeCloudinaryUrl.ts
 * Utility to clean and optimize Cloudinary image URLs for use with next/image
 */

const sanitizeImages = (url) => {
  if (!url || typeof url !== "string") return "";

  // Ensure https
  let cleanUrl = url.trim().replace(/^http:/, "https:");

  // Apply Cloudinary delivery optimization (only if it's a Cloudinary URL)
  if (
    cleanUrl.includes("res.cloudinary.com") &&
    cleanUrl.includes("/upload/")
  ) {
    cleanUrl = cleanUrl.replace("/upload/", "/upload/f_auto,q_auto/");
  }

  return cleanUrl;
};

export default sanitizeImages;
