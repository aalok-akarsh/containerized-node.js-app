const assert = require("node:assert/strict");
const test = require("node:test");
const { getHealthStatus } = require("../src/health");

test("getHealthStatus returns OK when all dependencies are connected", () => {
  assert.deepEqual(getHealthStatus({ mongoConnected: true, redisConnected: true }), {
    statusCode: 200,
    body: {
      status: "OK",
      mongodb: "connected",
      redis: "connected",
    },
  });
});

test("getHealthStatus returns degraded when a dependency is disconnected", () => {
  assert.deepEqual(getHealthStatus({ mongoConnected: true, redisConnected: false }), {
    statusCode: 503,
    body: {
      status: "Degraded",
      mongodb: "connected",
      redis: "disconnected",
    },
  });
});
