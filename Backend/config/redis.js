const { createClient } = require("redis");

let redisClient = null;
let isRedisConnected = false;

const connectRedis = async () => {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl || redisUrl === "mock") {
    console.log("Redis: running in MOCK (in-memory) mode");
    return null;
  }

  try {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on("error", (err) => {
      console.log("Redis Client Connection Error:", err.message);
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      console.log("Redis Connected successfully");
      isRedisConnected = true;
    });

    // Timeout connection attempt to prevent blocking server startup
    const connectPromise = redisClient.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Redis connection timed out")), 2000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    return redisClient;
  } catch (error) {
    console.log("Failed to connect to Redis. Falling back to in-memory session store. Error:", error.message);
    redisClient = null;
    isRedisConnected = false;
    return null;
  }
};

const getRedisClient = () => {
  return isRedisConnected ? redisClient : null;
};

module.exports = {
  connectRedis,
  getRedisClient
};
