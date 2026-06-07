const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_CLOUD_NAME !== "mock" &&
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_KEY !== "mock";

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("Cloudinary configured successfully.");
} else {
  console.log("Cloudinary API credentials mock or empty. Falling back to local storage + mock URL.");
}

// Multer storage configuration
const tempDir = path.join(__dirname, "../temp_uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadToCloudinary = async (filePath) => {
  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: "intellmeet_avatars"
      });
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    } catch (error) {
      console.log("Cloudinary upload failed, returning mock avatar URL:", error.message);
    }
  }
  
  // Clean up local temp file
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // Mock avatar fallback
  const randomSeed = Math.floor(Math.random() * 1000);
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${randomSeed}`;
};

module.exports = {
  upload,
  uploadToCloudinary
};
