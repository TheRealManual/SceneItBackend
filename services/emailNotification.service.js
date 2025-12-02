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

// Email template for movie share
const generateMovieShareEmail = (movie, senderName, personalMessage, recipientEmail) => {
  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}` 
    : 'https://via.placeholder.com/500x750?text=No+Poster';
  
  const trailerUrl = movie.videos && movie.videos.length > 0 
    ? `https://www.youtube.com/watch?v=${movie.videos[0].key}` 
    : null;

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
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
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
      color: #f093fb;
      font-weight: 600;
    }
    .movie-card {
      background: #222222;
      border-radius: 12px;
      overflow: hidden;
      margin: 30px 0;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
    }
    .movie-poster {
      width: 100%;
      height: auto;
      display: block;
    }
    .movie-details {
      padding: 24px;
    }
    .movie-title {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .movie-meta {
      font-size: 14px;
      color: #999999;
      margin-bottom: 16px;
    }
    .movie-overview {
      font-size: 16px;
      line-height: 1.6;
      color: #cccccc;
      margin-bottom: 20px;
    }
    .personal-message {
      background: #2a2a2a;
      border-left: 4px solid #f093fb;
      padding: 16px 20px;
      border-radius: 8px;
      margin: 24px 0;
      font-style: italic;
      color: #e0e0e0;
    }
    .cta-button {
      display: inline-block;
      background: #f093fb;
      color: white;
      padding: 16px 40px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      margin: 8px;
      box-shadow: 0 4px 14px rgba(240, 147, 251, 0.4);
      transition: all 0.25s ease;
      font-size: 16px;
    }
    .cta-button:hover {
      background: #f5576c;
      box-shadow: 0 6px 20px rgba(240, 147, 251, 0.6);
      transform: translateY(-2px);
    }
    .cta-button.secondary {
      background: #667eea;
    }
    .cta-button.secondary:hover {
      background: #764ba2;
    }
    .button-container {
      text-align: center;
      margin-top: 24px;
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
      <h1>🎬 Movie Recommendation</h1>
    </div>
    
    <div class="content">
      <p class="message">
        <span class="sender-name">${senderName}</span> thinks you'll love this movie!
      </p>
      
      ${personalMessage ? `
      <div class="personal-message">
        "${personalMessage}"
      </div>
      ` : ''}
      
      <div class="movie-card">
        <img src="${posterUrl}" alt="${movie.title} Poster" class="movie-poster">
        <div class="movie-details">
          <h2 class="movie-title">${movie.title}</h2>
          <p class="movie-meta">
            ${movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'} 
            ${movie.runtime ? `• ${movie.runtime} min` : ''} 
            ${movie.voteAverage ? `• ⭐ ${movie.voteAverage.toFixed(1)}/10` : ''}
          </p>
          <p class="movie-overview">
            ${movie.overview || 'No overview available.'}
          </p>
          
          <div class="button-container">
            <a href="${FRONTEND_URL}" class="cta-button">View on SceneIt</a>
            ${trailerUrl ? `<a href="${trailerUrl}" class="cta-button secondary">Watch Trailer</a>` : ''}
          </div>
        </div>
      </div>
      
      <p class="message" style="text-align: center; margin-top: 30px;">
        Join SceneIt to discover more movies and share recommendations with friends!
      </p>
    </div>
    
    <div class="footer">
      <p>SceneIt - Discover movies together 🎬</p>
      <p style="margin-top: 10px; font-size: 12px;">
        You received this email because ${senderName} shared a movie with you.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Send movie share email
async function sendMovieShareEmail(recipientEmail, movie, senderName, personalMessage = '') {
  try {
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    if (!movie) {
      throw new Error('Movie data is required');
    }

    const emailHTML = generateMovieShareEmail(
      movie,
      senderName || 'A SceneIt user',
      personalMessage,
      recipientEmail
    );

    await transporter.sendMail({
      from: `"SceneIt 🎬" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `${senderName || 'Someone'} recommends: ${movie.title}`,
      html: emailHTML
    });

    console.log(`✅ Movie share email sent to ${recipientEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending movie share email:', error);
    throw error;
  }
}

module.exports = {
  sendFriendRequestNotification,
  sendFriendRequestAcceptedNotification,
  sendFriendRequestDeclinedNotification,
  sendMovieShareEmail
};
