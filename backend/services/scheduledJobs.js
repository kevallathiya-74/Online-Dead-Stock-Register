const cron = require('node-cron');
const assetDisposalAutomation = require('./assetDisposalAutomation');
const assetLifecycleService = require('./assetLifecycleService');
const AuditLog = require('../models/auditLog');

/**
 * 🕐 SCHEDULED JOBS MANAGER
 * Manages all background automation tasks using node-cron
 */

class ScheduledJobsManager {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  /**
   * 🚀 INITIALIZE ALL SCHEDULED JOBS
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Job 1: Daily Lifecycle Automation (runs at 1 AM every day)
      this.scheduleLifecycleAutomation();

      // Job 2: Daily Disposal Check (runs at 2 AM every day)
      this.scheduleDisposalCheck();

      // Job 3: Weekly Statistics Update (runs at 3 AM every Monday)
      this.scheduleWeeklyStats();

      // Job 4: Audit Log Cleanup (runs at 4 AM on 1st of every month)
      this.scheduleAuditLogCleanup();

      this.isInitialized = true;
      this.printSchedule();
    } catch (error) {
      console.error('❌ Failed to initialize scheduled jobs:', error);
      throw error;
    }
  }

  /**
   * 🔄 SCHEDULE LIFECYCLE AUTOMATION
   * Runs at 1 AM every day - Moves outdated assets to dead stock, then to disposal
   */
  scheduleLifecycleAutomation() {
    // Cron: "0 1 * * *" = At 01:00 (1 AM) every day
    const job = cron.schedule('0 1 * * *', async () => {
      console.log('⏰ [CRON] Running lifecycle automation...');
      try {
        const result = await assetLifecycleService.runFullLifecycleAutomation();
        await this.logJobExecution('LIFECYCLE_AUTOMATION', result);
      } catch (error) {
        console.error('❌ [CRON] Lifecycle automation failed:', error);
        await this.logJobExecution('LIFECYCLE_AUTOMATION', {
          success: false,
          error: error.message,
        });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata',
    });

    this.jobs.set('lifecycle_automation', job);
  }

  /**
   * 🤖 SCHEDULE DAILY DISPOSAL CHECK
   * Runs at 2 AM every day
   */
  scheduleDisposalCheck() {
    // Cron: "0 2 * * *" = At 02:00 (2 AM) every day
    const job = cron.schedule('0 2 * * *', async () => {
      try {
        const result = await assetDisposalAutomation.runDisposalCheck();
        await this.logJobExecution('DISPOSAL_AUTOMATION', result);
      } catch (error) {
        console.error('❌ [CRON] Disposal check failed:', error);
        await this.logJobExecution('DISPOSAL_AUTOMATION', {
          success: false,
          error: error.message,
        });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata', // Indian Standard Time
    });

    this.jobs.set('disposal_check', job);
  }

  /**
   * 📊 SCHEDULE WEEKLY STATISTICS UPDATE
   * Runs at 3 AM every Monday
   */
  scheduleWeeklyStats() {
    // Cron: "0 3 * * 1" = At 03:00 (3 AM) every Monday
    const job = cron.schedule('0 3 * * 1', async () => {
      try {
        const stats = await assetDisposalAutomation.getAutomationStats();
        await this.logJobExecution('WEEKLY_STATS', {
          success: true,
          stats,
        });
      } catch (error) {
        console.error('❌ [CRON] Weekly stats failed:', error);
        await this.logJobExecution('WEEKLY_STATS', {
          success: false,
          error: error.message,
        });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata',
    });

    this.jobs.set('weekly_stats', job);
  }

  /**
   * 🗑️ SCHEDULE AUDIT LOG CLEANUP
   * Runs at 4 AM on the 1st of every month
   */
  scheduleAuditLogCleanup() {
    // Cron: "0 4 1 * *" = At 04:00 (4 AM) on day 1 of every month
    const job = cron.schedule('0 4 1 * *', async () => {
      try {
        // Delete logs older than 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const result = await AuditLog.deleteMany({
          created_at: { $lt: sixMonthsAgo },
        });
        
        await this.logJobExecution('AUDIT_LOG_CLEANUP', {
          success: true,
          deletedCount: result.deletedCount,
        });
      } catch (error) {
        console.error('❌ [CRON] Audit log cleanup failed:', error);
        await this.logJobExecution('AUDIT_LOG_CLEANUP', {
          success: false,
          error: error.message,
        });
      }
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata',
    });

    this.jobs.set('audit_cleanup', job);
  }

  /**
   * 🔧 MANUAL TRIGGER FOR LIFECYCLE AUTOMATION
   * Can be called via API endpoint for testing or manual runs
   */
  async triggerLifecycleNow() {
    try {
      console.log('🔧 [MANUAL] Running lifecycle automation...');
      const result = await assetLifecycleService.runFullLifecycleAutomation();
      await this.logJobExecution('LIFECYCLE_AUTOMATION_MANUAL', result);
      return result;
    } catch (error) {
      await this.logJobExecution('LIFECYCLE_AUTOMATION_MANUAL', {
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 🔧 MANUAL TRIGGER FOR DISPOSAL CHECK
   * Can be called via API endpoint for testing or manual runs
   */
  async triggerDisposalCheckNow() {
    try {
      const result = await assetDisposalAutomation.runDisposalCheck();
      await this.logJobExecution('DISPOSAL_AUTOMATION_MANUAL', result);
      return result;
    } catch (error) {
      await this.logJobExecution('DISPOSAL_AUTOMATION_MANUAL', {
        success: false,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * 📝 LOG JOB EXECUTION
   */
  async logJobExecution(jobName, result) {
    try {
      await AuditLog.create({
        action: 'SCHEDULED_JOB_EXECUTION',
        entity_type: 'System',
        entity_id: null,
        description: `Scheduled job "${jobName}" executed`,
        changes: result,
        performed_by: null, // System
        ip_address: 'scheduler',
      });
    } catch (error) {
      console.error('Failed to log job execution:', error);
    }
  }

  /**
   * 🖨️ PRINT SCHEDULE
   */
  printSchedule() {
    console.log('\n📋 Scheduled Jobs:');
    console.log('  • Lifecycle Automation: Daily 1 AM IST');
    console.log('  • Disposal Check: Daily 2 AM IST');
    console.log('  • Weekly Statistics: Mon 3 AM IST');
    console.log('  • Audit Cleanup: 1st 4 AM IST\n');
  }

  /**
   * ⏹️ STOP ALL JOBS
   */
  stopAll() {
    this.jobs.forEach((job, name) => {
      job.stop();
    });
    this.jobs.clear();
    this.isInitialized = false;
  }

  /**
   * 📊 GET JOB STATUS
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      active_jobs: Array.from(this.jobs.keys()),
      count: this.jobs.size,
    };
  }
}

// Export singleton instance
module.exports = new ScheduledJobsManager();
