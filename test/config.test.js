const assert = require("node:assert/strict");
const test = require("node:test");
const { readConfig } = require("../src/config");

test("readConfig parses valid environment values", () => {
  const config = readConfig({
    PORT: "8090",
    MONGO_URI: "mongodb://mongo:27017/devopsdb",
    REDIS_HOST: "redis",
    REDIS_PORT: "6379",
  });

  assert.deepEqual(config, {
    port: 8090,
    mongoUri: "mongodb://mongo:27017/devopsdb",
    redisHost: "redis",
    redisPort: 6379,
  });
});

test("readConfig reports missing required values", () => {
  assert.throws(
    () => readConfig({ PORT: "8090", REDIS_PORT: "6379" }),
    /MONGO_URI, REDIS_HOST/
  );
});

test("readConfig rejects invalid numeric ports", () => {
  assert.throws(
    () =>
      readConfig({
        PORT: "nope",
        MONGO_URI: "mongodb://mongo:27017/devopsdb",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
      }),
    /PORT/
  );
});
