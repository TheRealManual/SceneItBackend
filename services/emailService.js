const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if Gmail credentials are configured
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
          process.env.EMAIL_USER !== 'REPLACE_WITH_YOUR_GMAIL') {
        
        // Use Gmail for production
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });
        
        console.log('📧 Email service initialized with Gmail');
      } else {
        // Use Ethereal Email for testing/development
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        
        console.log('📧 Email service initialized with Ethereal Email (test mode)');
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      return false;
    }
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      if (!this.transporter) {
        await this.initializeTransporter();
      }

      const mailOptions = {
        from: process.env.EMAIL_USER || 'SceneIt <sceneit@ethereal.email>',
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      // For Ethereal Email, show preview URL
      if (result.envelope && result.envelope.from.includes('ethereal.email')) {
        const previewURL = nodemailer.getTestMessageUrl(result);
        console.log(`📧 Email sent successfully to ${to}`);
        console.log(`Preview URL: ${previewURL}`);
        
        return { 
          success: true, 
          messageId: result.messageId,
          previewURL: previewURL 
        };
      } else {
        // Gmail - just log success
        console.log(`📧 Email sent successfully to ${to} via Gmail`);
        return { 
          success: true, 
          messageId: result.messageId
        };
      }
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>?/gm, '');
  }
}

module.exports = new EmailService();