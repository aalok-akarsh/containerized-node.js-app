require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");

const app = express();

const PORT = process.env.PORT || 8090;
const MONGO_URI = process.env.MONGO_URI;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

/* MongoDB Connection */

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

/* Redis Connection */

const redisClient = redis.createClient({
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

redisClient
  .connect()
  .then(() => console.log("Redis connected"))
  .catch((err) => console.error("Redis connection error:", err));

/* Routes */

app.get("/", async (req, res) => {
  try {
    const cachedData = await redisClient.get("message");

    if (cachedData) {
      return res.json({
        source: "redis-cache",
        message: cachedData,
      });
    }

    const message = "Node DevOps Application Running";

    await redisClient.set("message", message);

    res.json({
      source: "server",
      message,
    });
  } catch (err) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    redis: redisClient.isOpen ? "connected" : "disconnected",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});