const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
    title: String,
    host: String,
    participants: []
});

module.exports = mongoose.model("Meeting", meetingSchema);