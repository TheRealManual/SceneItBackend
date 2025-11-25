const express = require('express');
const router = express.Router();
const https = require('https');

// Proxy for Google profile photos to avoid CORS and rate limiting
router.get('/photo/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.params.userId).select('photo');
    
    if (!user || !user.photo) {
      return res.status(404).send('Photo not found');
    }

    // Fetch the image from Google
    https.get(user.photo, (response) => {
      // Set cache headers to reduce requests
      res.set({
        'Content-Type': response.headers['content-type'],
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      });
      
      response.pipe(res);
    }).on('error', (err) => {
      console.error('Error fetching photo:', err);
      res.status(500).send('Failed to fetch photo');
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
