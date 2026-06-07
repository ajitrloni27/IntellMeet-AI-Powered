const express = require("express");
const router = express.Router();

const {
    register,
    login,
    getProfile,
    updateProfile
} = require("../controllers/authController");

const limiter = require("../middleware/rateLimiter");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

router.post("/register", limiter, register);
router.post("/login", limiter, login);
router.get("/profile", authMiddleware, getProfile);
router.patch("/profile", authMiddleware, upload.single("avatar"), updateProfile);

module.exports = router;