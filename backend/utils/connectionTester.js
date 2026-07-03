const getSupabase = require("../config/db");
const nodemailer = require("nodemailer");
const Redis = require("ioredis");
const logger = require("./logger");

/**
 * Test Supabase Database connection
 */
async function testDatabaseConnection() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "Database connection successful",
      details: {
        provider: "Supabase (PostgreSQL)",
        status: "Connected",
      },
    };
  } catch (error) {
    logger.error("Database connection test failed:", error);
    return {
      success: false,
      message: "Database connection failed",
      error: error.message,
    };
  }
}

/**
 * Test SMTP email connection
 */
async function testEmailConnection(emailConfig = null) {
  try {
    const config = emailConfig || {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    };

    if (!config.auth.user || !config.auth.pass) {
      return {
        success: false,
        message: "Email credentials not provided",
        error: "SMTP_USER and SMTP_PASSWORD not configured",
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport(config);

    // Verify connection
    await transporter.verify();

    return {
      success: true,
      message: "Email connection successful",
      details: {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
      },
    };
  } catch (error) {
    logger.error("Email connection test failed:", error);
    return {
      success: false,
      message: "Email connection failed",
      error: error.message,
    };
  }
}

/**
 * Test Redis connection
 */
async function testRedisConnection(redisUrl = null) {
  let client = null;

  try {
    const url = redisUrl || process.env.REDIS_URL;

    if (!url) {
      return {
        success: false,
        message: "No Redis URL provided",
        error: "REDIS_URL not configured",
      };
    }

    // Create Redis client using ioredis
    client = new Redis(url, {
      connectTimeout: 5000,
      lazyConnect: true,
    });

    // Handle connection errors
    client.on("error", (err) => {
      logger.error("Redis client error:", err);
    });

    // Connect
    await client.connect();

    // Test ping
    const pong = await client.ping();

    // Get server info
    const info = await client.info();
    const lines = info.split("\r\n");
    const version = lines
      .find((line) => line.startsWith("redis_version:"))
      ?.split(":")[1];
    const uptime = lines
      .find((line) => line.startsWith("uptime_in_seconds:"))
      ?.split(":")[1];

    // Close connection
    await client.quit();

    return {
      success: true,
      message: "Redis connection successful",
      details: {
        response: pong,
        version: version || "unknown",
        uptime: uptime ? `${uptime} seconds` : "unknown",
      },
    };
  } catch (error) {
    logger.error("Redis connection test failed:", error);

    // Ensure client is closed
    if (client && client.status === "ready") {
      try {
        await client.quit();
      } catch (closeError) {
        logger.error("Error closing Redis client:", closeError);
      }
    }

    return {
      success: false,
      message: "Redis connection failed",
      error: error.message,
    };
  }
}

/**
 * Test all connections
 */
async function testAllConnections(config = {}) {
  const results = {
    database: await testDatabaseConnection(config.databaseUrl),
    email: await testEmailConnection(config.email),
  };

  // Only test Redis if URL is configured
  if (process.env.REDIS_URL || config.redisUrl) {
    results.redis = await testRedisConnection(config.redisUrl);
  }

  const allSuccess = Object.values(results).every((result) => result.success);

  return {
    success: allSuccess,
    message: allSuccess
      ? "All connections successful"
      : "Some connections failed",
    results,
  };
}

/**
 * Send test email
 */
async function sendTestEmail(emailConfig, testAddress) {
  try {
    const config = {
      host: emailConfig.smtpHost,
      port: emailConfig.smtpPort,
      secure: emailConfig.smtpSecure,
      auth: {
        user: emailConfig.smtpUser,
        pass: emailConfig.smtpPassword,
      },
    };

    const transporter = nodemailer.createTransport(config);

    const info = await transporter.sendMail({
      from: `"${emailConfig.fromName}" <${emailConfig.fromEmail}>`,
      to: testAddress,
      subject: "DSR - Test Email",
      text: "This is a test email from DSR system to verify email configuration.",
      html: "<p>This is a test email from <strong>DSR system</strong> to verify email configuration.</p>",
    });

    return {
      success: true,
      message: "Test email sent successfully",
      details: {
        messageId: info.messageId,
        recipient: testAddress,
      },
    };
  } catch (error) {
    logger.error("Test email failed:", error);
    return {
      success: false,
      message: "Failed to send test email",
      error: error.message,
    };
  }
}

module.exports = {
  testDatabaseConnection,
  testEmailConnection,
  testRedisConnection,
  testAllConnections,
  sendTestEmail,
};
