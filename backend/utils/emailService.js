const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  // Test email connection
  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service is ready');
      return true;
    } catch (error) {
      console.error('❌ Email service error:', error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(to, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Password Reset - Dead Stock Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Dead Stock Management System</h2>
          <p>You have requested to reset your password.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #3498db; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #7f8c8d; font-size: 14px;">
            This link is valid for 1 hour. If you didn't request this reset, please ignore this email.
          </p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            This is an automated email, please do not reply.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent to:', to);
      return true;
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw error;
    }
  }

  // Send welcome email
  async sendWelcomeEmail(to, name) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Welcome to Dead Stock Management System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to Dead Stock Management System</h2>
          <p>Hello ${name},</p>
          <p>Thank you for joining our Dead Stock Management System. We're excited to have you on board!</p>
          <p>You can now:</p>
          <ul>
            <li>Track and manage dead stock items</li>
            <li>Generate reports</li>
            <li>Monitor asset status</li>
            <li>And much more...</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            This is an automated email, please do not reply.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent to:', to);
      return true;
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      throw error;
    }
  }

  // Send asset assignment notification
  async sendAssetAssignmentEmail(to, userName, assetDetails) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: 'Asset Assignment Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Asset Assignment Notification</h2>
          <p>Hello ${userName},</p>
          <p>An asset has been assigned to you:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px;">
            <p><strong>Asset Name:</strong> ${assetDetails.name}</p>
            <p><strong>Asset ID:</strong> ${assetDetails.id}</p>
            <p><strong>Category:</strong> ${assetDetails.category}</p>
            <p><strong>Assignment Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <p>Please verify the asset details and report any discrepancies.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">
            This is an automated email, please do not reply.
          </p>
        </div>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Asset assignment email sent to:', to);
      return true;
    } catch (error) {
      console.error('❌ Error sending asset assignment email:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();