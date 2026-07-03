const express = require("express");
const router = express.Router();
const logController = require("../controllers/logController");
const rateLimit = require("express-rate-limit");

const logIngestLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 logs per minute
  message: { success: false, error: "Log ingestion rate limit exceeded" },
});

router.post("/", logIngestLimiter, logController.ingestClientLog);

module.exports = router;
