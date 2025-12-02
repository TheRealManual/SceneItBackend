const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://main.d1ur5bc2o4pggx.amplifyapp.com';

// Email template for friend request notification
const generateFriendRequestEmail = (senderName, recipientName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #000000;
      margin: 0;
      padding: 50px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #181818;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
      background: #181818;
      color: #ffffff;
    }
    .message {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
      color: #e0e0e0;
    }
    .sender-name {
      color: #667eea;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
      transition: all 0.25s ease;
      font-size: 16px;
    }
    .cta-button:hover {
      background: #764ba2;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      transform: translateY(-2px);
    }
    .footer {
      background: #141414;
      padding: 30px;
      text-align: center;
      color: #808080;
      font-size: 14px;
      border-top: 1px solid #333333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>👥 New Friend Request</h1>
    </div>
    
    <div class="content">
      <p class="message">
        Hi <strong>${recipientName}</strong>! 👋
      </p>
      <p class="message">
        <span class="sender-name">${senderName}</span> wants to connect with you on SceneIt!
      </p>
      <p class="message">
        View and respond to this friend request to start sharing your movie preferences.
      </p>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}" class="cta-button">View Friend Request</a>
      </div>
    </div>
    
    <div class="footer">
      <p>SceneIt - Discover movies together 🎬</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Email template for friend request accepted
const generateFriendRequestAcceptedEmail = (accepterName, requesterName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #000000;
      margin: 0;
      padding: 50px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #181818;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
    }
    .header {
      background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
      background: #181818;
      color: #ffffff;
    }
    .message {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
      color: #e0e0e0;
    }
    .friend-name {
      color: #28a745;
      font-weight: 600;
    }
    .cta-button {
      display: inline-block;
      background: #28a745;
      color: white;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      box-shadow: 0 4px 14px rgba(40, 167, 69, 0.4);
      transition: all 0.25s ease;
      font-size: 16px;
    }
    .cta-button:hover {
      background: #20c997;
      box-shadow: 0 6px 20px rgba(40, 167, 69, 0.6);
      transform: translateY(-2px);
    }
    .footer {
      background: #141414;
      padding: 30px;
      text-align: center;
      color: #808080;
      font-size: 14px;
      border-top: 1px solid #333333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Friend Request Accepted</h1>
    </div>
    
    <div class="content">
      <p class="message">
        Hi <strong>${requesterName}</strong>! 👋
      </p>
      <p class="message">
        Great news! <span class="friend-name">${accepterName}</span> has accepted your friend request!
      </p>
      <p class="message">
        You can now see each other's movie preferences and discover films together.
      </p>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}" class="cta-button">View Your Friends</a>
      </div>
    </div>
    
    <div class="footer">
      <p>SceneIt - Discover movies together 🎬</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Email template for friend request declined
const generateFriendRequestDeclinedEmail = (declinerName, requesterName) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      background: #000000;
      margin: 0;
      padding: 50px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #181818;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
    }
    .header {
      background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 40px;
      background: #181818;
      color: #ffffff;
    }
    .message {
      font-size: 18px;
      line-height: 1.6;
      margin-bottom: 30px;
      color: #e0e0e0;
    }
    .cta-button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin-top: 20px;
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
      transition: all 0.25s ease;
      font-size: 16px;
    }
    .cta-button:hover {
      background: #764ba2;
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
      transform: translateY(-2px);
    }
    .footer {
      background: #141414;
      padding: 30px;
      text-align: center;
      color: #808080;
      font-size: 14px;
      border-top: 1px solid #333333;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Friend Request Update</h1>
    </div>
    
    <div class="content">
      <p class="message">
        Hi <strong>${requesterName}</strong>,
      </p>
      <p class="message">
        ${declinerName} has declined your friend request.
      </p>
      <p class="message">
        Don't worry - keep exploring and connecting with other movie lovers on SceneIt!
      </p>
      
      <div style="text-align: center;">
        <a href="${FRONTEND_URL}" class="cta-button">Find More Friends</a>
      </div>
    </div>
    
    <div class="footer">
      <p>SceneIt - Discover movies together 🎬</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send friend request notification
async function sendFriendRequestNotification(senderUser, recipientUser) {
  try {
    if (!recipientUser.email) {
      console.log('Recipient has no email address');
      return;
    }

    const emailHTML = generateFriendRequestEmail(
      senderUser.displayName || 'A SceneIt user',
      recipientUser.displayName || 'there'
    );

    await transporter.sendMail({
      from: `"SceneIt 👥" <${process.env.EMAIL_USER}>`,
      to: recipientUser.email,
      subject: `${senderUser.displayName || 'Someone'} wants to connect on SceneIt!`,
      html: emailHTML
    });

    console.log(`✅ Friend request notification sent to ${recipientUser.email}`);
  } catch (error) {
    console.error('Error sending friend request notification:', error);
  }
}

// Send friend request accepted notification
async function sendFriendRequestAcceptedNotification(accepterUser, requesterUser) {
  try {
    if (!requesterUser.email) {
      console.log('Requester has no email address');
      return;
    }

    const emailHTML = generateFriendRequestAcceptedEmail(
      accepterUser.displayName || 'A SceneIt user',
      requesterUser.displayName || 'there'
    );

    await transporter.sendMail({
      from: `"SceneIt 👥" <${process.env.EMAIL_USER}>`,
      to: requesterUser.email,
      subject: `${accepterUser.displayName || 'Someone'} accepted your friend request!`,
      html: emailHTML
    });

    console.log(`✅ Friend request accepted notification sent to ${requesterUser.email}`);
  } catch (error) {
    console.error('Error sending friend request accepted notification:', error);
  }
}

// Send friend request declined notification
async function sendFriendRequestDeclinedNotification(declinerUser, requesterUser) {
  try {
    if (!requesterUser.email) {
      console.log('Requester has no email address');
      return;
    }

    const emailHTML = generateFriendRequestDeclinedEmail(
      declinerUser.displayName || 'A SceneIt user',
      requesterUser.displayName || 'there'
    );

    await transporter.sendMail({
      from: `"SceneIt 👥" <${process.env.EMAIL_USER}>`,
      to: requesterUser.email,
      subject: 'Friend Request Update - SceneIt',
      html: emailHTML
    });

    console.log(`✅ Friend request declined notification sent to ${requesterUser.email}`);
  } catch (error) {
    console.error('Error sending friend request declined notification:', error);
  }
}

module.exports = {
  sendFriendRequestNotification,
  sendFriendRequestAcceptedNotification,
  sendFriendRequestDeclinedNotification
};
