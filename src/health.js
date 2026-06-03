function getHealthStatus({ mongoConnected, redisConnected }) {
  const healthy = Boolean(mongoConnected && redisConnected);

  return {
    statusCode: healthy ? 200 : 503,
    body: {
      status: healthy ? "OK" : "Degraded",
      mongodb: mongoConnected ? "connected" : "disconnected",
      redis: redisConnected ? "connected" : "disconnected",
    },
  };
}

module.exports = { getHealthStatus };
