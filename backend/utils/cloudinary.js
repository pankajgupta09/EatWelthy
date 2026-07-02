const cloudinary = require("cloudinary").v2;

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "[cloudinary] Missing CLOUDINARY_* env vars — avatar uploads will fail until configured."
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const AVATAR_FOLDER = "eatwellthy/avatars";

function uploadAvatarToCloudinary(buffer, userId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: AVATAR_FOLDER,
        public_id: `user_${userId}_${Date.now()}`,
        resource_type: "image",
        overwrite: true,
        transformation: [
          { width: 512, height: 512, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
}

async function deleteAvatarFromCloudinary(publicId) {
  if (!publicId) return;
  return cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

module.exports = { uploadAvatarToCloudinary, deleteAvatarFromCloudinary };
