const express = require("express");
const router = express.Router();

const {
    createMeeting,
    getMeetings
} = require("../controllers/meetingController");

const authMiddleware = require("../middleware/authMiddleware");

router.post("/meeting", authMiddleware, createMeeting);
router.get("/meeting", authMiddleware, getMeetings);

module.exports = router;