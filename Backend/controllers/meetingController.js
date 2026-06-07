const Meeting = require("../models/Meeting");

exports.createMeeting = async (req, res) => {

    const meeting = await Meeting.create(req.body);

    res.json({
        message: "Meeting Created",
        meeting
    });
};

exports.getMeetings = async (req, res) => {

    const meetings = await Meeting.find();

    res.json(meetings);
};