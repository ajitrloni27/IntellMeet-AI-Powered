const express = require("express");
const router = express.Router();
const { transcribe, generateSummary } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");
const { upload } = require("../config/cloudinary");

router.post("/transcribe", authMiddleware, upload.single("audio"), transcribe);
router.post("/summary", authMiddleware, generateSummary);

module.exports = router;
