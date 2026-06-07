const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");

//Authentication
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User");


// const authRoutes = require("./routes/authRoutes"); // Auth disabled
const meetingRoutes = require("./routes/meetingRoutes");
const aiRoutes = require("./routes/aiRoutes");
const taskRoutes = require("./routes/taskRoutes");

const socketHandler = require("./socket/socketHandler");
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./config/db");
const { connectRedis } = require("./config/redis");

const app = express();

connectDB();
connectRedis();

app.use(express.json());
app.use(cors());
app.use(helmet());

// app.use("/auth", authRoutes); // Auth disabled
app.use("/ai", aiRoutes);
app.use("/", taskRoutes);
app.use("/", meetingRoutes);

app.get("/", (req, res) => {
    res.send("IntellMeet Backend Running");
});

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

socketHandler(io);

//signup
app.post("/signup", async (req, res) => {

  try {

    const {name, email, password } = req.body;

    // Check existing user
    const existingUser = await User.findOne({
      email
    });

    if (existingUser) {

      return res.json({
        message: "User already exists"
      });

    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Save user
    const user = new User({
      name, 
      
      email,

      password: hashedPassword

    });

    await user.save();

    res.json({
      message: "Signup successful"
    });

  } catch (error) {

    console.log(error);

    res.json({
      message: "Signup failed"
    });

  }

});


//login
app.post("/login", async (req, res) => {

  try {

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      email
    });

    if (!user) {

      return res.json({
        message: "User not found"
      });

    }

    // Compare password
    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {

      return res.json({
        message: "Wrong password"
      });

    }

    // JWT token
    const token = jwt.sign(

      { id: user._id },

      "mysecretkey"

    );

    res.json({

      message: "Login successful",

      token

    });

  } catch (error) {

    console.log(error);

    res.json({
      message: "Login failed"
    });

  }

});



server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});