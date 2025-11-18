const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Unsubscribe from recommendation emails
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize emailPreferences if it doesn't exist
    if (!user.emailPreferences) {
      user.emailPreferences = {
        unsubscribedFromRecommendations: false,
        unsubscribedAt: null
      };
    }
    
    user.emailPreferences.unsubscribedFromRecommendations = true;
    user.emailPreferences.unsubscribedAt = new Date();
    await user.save();
    
    res.json({ 
      message: 'Successfully unsubscribed from recommendation emails',
      success: true
    });
  } catch (error) {
    console.error('Error unsubscribing from emails:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Resubscribe to recommendation emails
router.post('/resubscribe', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize emailPreferences if it doesn't exist
    if (!user.emailPreferences) {
      user.emailPreferences = {
        unsubscribedFromRecommendations: false,
        unsubscribedAt: null
      };
    }
    
    user.emailPreferences.unsubscribedFromRecommendations = false;
    user.emailPreferences.unsubscribedAt = null;
    await user.save();
    
    res.json({ 
      message: 'Successfully resubscribed to recommendation emails',
      success: true
    });
  } catch (error) {
    console.error('Error resubscribing to emails:', error);
    res.status(500).json({ error: 'Failed to resubscribe' });
  }
});

module.exports = router;
