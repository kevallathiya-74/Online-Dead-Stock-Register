const request = require("supertest");
const express = require("express");
const logRoutes = require("../routes/logRoutes");

const app = express();
app.use(express.json());
app.use("/api/v1/logs", logRoutes);

describe("Client Log Ingestion Endpoint", () => {
  it("should ingest client logs successfully", async () => {
    const res = await request(app)
      .post("/api/v1/logs")
      .send({
        level: "error",
        message: "Test frontend unhandled error",
        meta: { test: true },
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should fail if message is missing", async () => {
    const res = await request(app).post("/api/v1/logs").send({
      level: "info",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
