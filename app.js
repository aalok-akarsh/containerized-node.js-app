require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const redis = require("redis");
const { readConfig } = require("./src/config");
const { getHealthStatus } = require("./src/health");

const app = express();

const config = readConfig();

/* MongoDB Connection */
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

/* Redis Connection */
const redisClient = redis.createClient({
  socket: {
    host: config.redisHost,
    port: config.redisPort,
  },
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

redisClient
  .connect()
  .then(() => console.log("Redis connected successfully"))
  .catch((err) => console.error("Redis connection error:", err.message));

/* Routes */
app.get("/", async (req, res) => {
  try {
    if (!redisClient.isOpen) {
      return res.json({ source: "server", message: "Node DevOps Application Running (Redis Offline)" });
    }

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
    console.error("Route error:", err);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

app.get("/health", (req, res) => {
  const health = getHealthStatus({
    mongoConnected: mongoose.connection.readyState === 1,
    redisConnected: redisClient.isOpen,
  });

  res.status(health.statusCode).json(health.body);
});

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
