const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No Token" });
    }

    // Support Bearer schema
    if (token.startsWith("Bearer ")) {
        token = token.substring(7);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "mysecretkey");
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Invalid Token" });
    }
};

module.exports = authMiddleware;