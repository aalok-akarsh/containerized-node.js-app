function readConfig(env = process.env) {
  const missing = [];

  if (!env.MONGO_URI) missing.push("MONGO_URI");
  if (!env.REDIS_HOST) missing.push("REDIS_HOST");

  const port = Number.parseInt(env.PORT || "8090", 10);
  const redisPort = Number.parseInt(env.REDIS_PORT || "6379", 10);

  if (!Number.isInteger(port) || port <= 0) missing.push("PORT");
  if (!Number.isInteger(redisPort) || redisPort <= 0) missing.push("REDIS_PORT");

  if (missing.length > 0) {
    throw new Error(`Missing or invalid environment variables: ${missing.join(", ")}`);
  }

  return {
    port,
    mongoUri: env.MONGO_URI,
    redisHost: env.REDIS_HOST,
    redisPort,
  };
}

module.exports = { readConfig };
