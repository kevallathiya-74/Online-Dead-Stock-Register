const cron = require('node-cron');
const axios = require('axios');

/**
 * 🔥 KEEP-ALIVE SERVICE
 * Prevents Render free instance from spinning down due to inactivity
 * Pings itself every 14 minutes to maintain active state
 */

class KeepAliveService {
  constructor() {
    this.pingJob = null;
    this.isActive = false;
    this.baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    this.pingInterval = 14; // minutes (Render spins down after 15 min of inactivity)
    this.lastPing = null;
    this.successCount = 0;
    this.failCount = 0;
  }

  /**
   * 🚀 START KEEP-ALIVE MECHANISM
   */
  start() {
    // Only enable for production (Render deployment)
    if (process.env.NODE_ENV !== 'production') {
      console.log('⏭️  Keep-alive disabled (not in production mode)');
      return;
    }

    if (this.isActive) {
      console.log('⚠️  Keep-alive already running');
      return;
    }

    try {
      // Schedule self-ping every 14 minutes
      // Cron pattern: */14 * * * * = Every 14 minutes
      this.pingJob = cron.schedule(`*/${this.pingInterval} * * * *`, async () => {
        await this.selfPing();
      }, {
        scheduled: true,
        timezone: process.env.TIMEZONE || 'Asia/Kolkata',
      });

      this.isActive = true;
      console.log('✅ Keep-Alive Service Started');
      console.log(`🔄 Self-ping every ${this.pingInterval} minutes`);
      console.log(`🌐 Target URL: ${this.baseUrl}/api/health`);

      // Immediate first ping
      setTimeout(() => this.selfPing(), 5000);
    } catch (error) {
      console.error('❌ Failed to start keep-alive service:', error.message);
    }
  }

  /**
   * 🏓 SELF-PING TO PREVENT SPIN-DOWN
   */
  async selfPing() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/api/health`, {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'KeepAlive-Service',
          'X-Keep-Alive': 'true',
        },
      });

      const latency = Date.now() - startTime;
      this.lastPing = new Date();
      this.successCount++;

      console.log(`✅ Keep-Alive Ping #${this.successCount} | Latency: ${latency}ms | ${this.lastPing.toLocaleTimeString()}`);

      return {
        success: true,
        latency,
        timestamp: this.lastPing,
      };
    } catch (error) {
      this.failCount++;
      console.error(`❌ Keep-Alive Ping Failed (${this.failCount}):`, error.message);

      return {
        success: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * 🛑 STOP KEEP-ALIVE MECHANISM
   */
  stop() {
    if (this.pingJob) {
      this.pingJob.stop();
      this.isActive = false;
      console.log('🛑 Keep-Alive Service Stopped');
    }
  }

  /**
   * 📊 GET STATISTICS
   */
  getStats() {
    return {
      isActive: this.isActive,
      lastPing: this.lastPing,
      successCount: this.successCount,
      failCount: this.failCount,
      pingInterval: `${this.pingInterval} minutes`,
      targetUrl: `${this.baseUrl}/api/health`,
      uptime: this.lastPing ? Math.floor((Date.now() - this.lastPing.getTime()) / 1000) : null,
    };
  }
}

// Singleton instance
const keepAliveService = new KeepAliveService();

module.exports = keepAliveService;
