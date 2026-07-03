/**
 * Client log ingestion controller
 * Captures logs and unhandled exceptions sent from the React frontend
 */
const logger = require("../utils/logger");

exports.ingestClientLog = (req, res) => {
  const { level = "info", message, meta = {} } = req.body;

  if (!message) {
    return res
      .status(400)
      .json({ success: false, error: "Log message is required" });
  }

  const logMeta = {
    ...meta,
    clientIp: req.ip,
    userAgent: req.get("user-agent"),
    source: "client-frontend",
  };

  const allowedLevels = ["error", "warn", "info", "debug"];
  const targetLevel = allowedLevels.includes(level) ? level : "info";

  logger[targetLevel](`[Client] ${message}`, logMeta);

  res.status(200).json({ success: true });
};
