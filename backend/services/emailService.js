const nodemailer = require('nodemailer');

/**
 * Email Service for sending notifications
 * Uses nodemailer to send emails via SMTP
 */

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
  if (transporter) return transporter;
  
  // Configure based on environment
  const emailConfig = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  };

  // For development, use ethereal email (fake SMTP service)
  if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_USER) {
    console.log('⚠️  Email service in development mode - emails will be logged to console');
    return null; // Will use console.log instead
  }

  transporter = nodemailer.createTransport(emailConfig);
  
  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service initialization failed:', error.message);
    } else {
      console.log('✅ Email service ready');
    }
  });

  return transporter;
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = initializeTransporter();
    
    // In development without email config, just log
    if (!transport) {
      console.log('\n📧 EMAIL (Development Mode):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', text || html);
      console.log('---\n');
      return { success: true, dev_mode: true };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Asset Management System'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text
    };

    const info = await transport.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
    return {
      success: true,
      messageId: info.messageId
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    throw error;
  }
};

// Template: Audit Reminder
const sendAuditReminder = async ({ recipients, auditName, auditDate, auditType, assetsCount }) => {
  const subject = `Reminder: Scheduled Audit "${auditName}" - ${auditDate}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🔔 Scheduled Audit Reminder</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>This is a reminder that you have a scheduled audit coming up:</p>
          
          <div class="details">
            <strong>Audit Name:</strong> ${auditName}<br>
            <strong>Scheduled Date:</strong> ${new Date(auditDate).toLocaleString()}<br>
            <strong>Audit Type:</strong> ${auditType}<br>
            <strong>Assets to Audit:</strong> ${assetsCount} assets
          </div>
          
          <p>Please ensure you are prepared to conduct this audit on the scheduled date.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/audits" class="button">View Audit Details</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Asset Management System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Scheduled Audit Reminder
    
    Audit Name: ${auditName}
    Scheduled Date: ${new Date(auditDate).toLocaleString()}
    Audit Type: ${auditType}
    Assets to Audit: ${assetsCount} assets
    
    Please ensure you are prepared to conduct this audit on the scheduled date.
    
    View details at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/audits
  `;

  return sendEmail({ to: recipients, subject, html, text });
};

// Template: Audit Completion Notification
const sendAuditCompletionNotification = async ({ recipients, auditName, completionDate, statistics }) => {
  const subject = `Audit Completed: "${auditName}"`;
  
  const { total, found, notFound, damaged, missing } = statistics;
  const completionRate = ((found / total) * 100).toFixed(1);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
        .stat-box { background: white; padding: 15px; text-align: center; border-radius: 4px; border: 1px solid #ddd; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2196F3; }
        .stat-label { font-size: 12px; color: #777; text-transform: uppercase; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>✅ Audit Completed</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>The scheduled audit <strong>"${auditName}"</strong> has been completed.</p>
          
          <h3>Audit Statistics:</h3>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${total}</div>
              <div class="stat-label">Total Assets</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #4CAF50;">${found}</div>
              <div class="stat-label">Found</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #ff9800;">${notFound}</div>
              <div class="stat-label">Not Found</div>
            </div>
            <div class="stat-box">
              <div class="stat-value" style="color: #f44336;">${damaged}</div>
              <div class="stat-label">Damaged</div>
            </div>
          </div>
          
          <p><strong>Completion Rate:</strong> ${completionRate}%</p>
          
          ${missing > 0 ? `<div class="alert">
            <strong>⚠️ Attention Required:</strong> ${missing} asset(s) are missing and require immediate attention.
          </div>` : ''}
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/audits/reports" class="button">View Full Report</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Asset Management System.</p>
          <p>Completed on: ${new Date(completionDate).toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Audit Completed: "${auditName}"
    
    Audit Statistics:
    - Total Assets: ${total}
    - Found: ${found}
    - Not Found: ${notFound}
    - Damaged: ${damaged}
    - Missing: ${missing}
    
    Completion Rate: ${completionRate}%
    
    ${missing > 0 ? `⚠️ ${missing} asset(s) are missing and require immediate attention.` : ''}
    
    View full report at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/audits/reports
    
    Completed on: ${new Date(completionDate).toLocaleString()}
  `;

  return sendEmail({ to: recipients, subject, html, text });
};

// Template: Audit Overdue Notification
const sendAuditOverdueNotification = async ({ recipients, auditName, dueDate }) => {
  const subject = `⚠️ Overdue Audit: "${auditName}"`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f44336; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
        .alert { background: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
        .button { display: inline-block; padding: 10px 20px; background: #f44336; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>⚠️ Audit Overdue</h2>
        </div>
        <div class="content">
          <p>Hello,</p>
          
          <div class="alert">
            <strong>The scheduled audit "${auditName}" is now overdue!</strong>
          </div>
          
          <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleString()}</p>
          
          <p>Please complete this audit as soon as possible or reschedule if needed.</p>
          
          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/audits" class="button">Complete Audit Now</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message from the Asset Management System.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ⚠️ Audit Overdue
    
    The scheduled audit "${auditName}" is now overdue!
    
    Due Date: ${new Date(dueDate).toLocaleString()}
    
    Please complete this audit as soon as possible or reschedule if needed.
    
    Complete audit at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/audits
  `;

  return sendEmail({ to: recipients, subject, html, text });
};

module.exports = {
  sendEmail,
  sendAuditReminder,
  sendAuditCompletionNotification,
  sendAuditOverdueNotification,
  initializeTransporter
};
