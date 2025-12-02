const express = require('express');
const router = express.Router();
const Friend = require('../models/Friend');
const User = require('../models/User');
const { 
  sendFriendRequestNotification, 
  sendFriendRequestAcceptedNotification, 
  sendFriendRequestDeclinedNotification 
} = require('../services/emailNotification.service');

// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
};

// Search for users by name
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ users: [] });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } },
        {
          $or: [
            { displayName: { $regex: query, $options: 'i' } },
            { email: { $regex: query, $options: 'i' } }
          ]
        }
      ]
    })
    .select('displayName email photo')
    .limit(10);

    res.json({ users });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Send friend request
router.post('/request', requireAuth, async (req, res) => {
  try {
    const { friendId } = req.body;
    const userId = req.user._id;

    if (userId.toString() === friendId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if there's a previously declined request FROM this user TO the friend
    const declinedRequest = await Friend.findOne({
      userId: friendId,
      friendId: userId,
      status: 'declined',
      requestedBy: userId
    });

    if (declinedRequest) {
      return res.status(403).json({ 
        error: 'Cannot send request to user who previously declined you' 
      });
    }

    // Check if friendship already exists in either direction
    const existingFriend = await Friend.findOne({
      $or: [
        { userId, friendId },
        { userId: friendId, friendId: userId }
      ]
    });

    if (existingFriend) {
      if (existingFriend.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' });
      }
      if (existingFriend.status === 'pending') {
        return res.status(400).json({ error: 'Friend request already pending' });
      }
    }

    // Create bidirectional friendship records
    await Friend.create([
      {
        userId,
        friendId,
        status: 'pending',
        requestedBy: userId
      },
      {
        userId: friendId,
        friendId: userId,
        status: 'pending',
        requestedBy: userId
      }
    ]);

    // Send email notification to the recipient
    const sender = await User.findById(userId);
    sendFriendRequestNotification(sender, friend).catch(err => 
      console.error('Failed to send friend request email:', err)
    );

    res.json({ message: 'Friend request sent' });
  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get all friends (accepted)
router.get('/list', requireAuth, async (req, res) => {
  try {
    const friends = await Friend.find({
      userId: req.user._id,
      status: 'accepted'
    })
    .populate('friendId', 'displayName email photo')
    .sort({ updatedAt: -1 });

    res.json({ friends: friends.map(f => f.friendId) });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ error: 'Failed to get friends' });
  }
});

// Get received friend requests
router.get('/requests/received', requireAuth, async (req, res) => {
  try {
    const requests = await Friend.find({
      userId: req.user._id,
      status: 'pending',
      requestedBy: { $ne: req.user._id }
    })
    .populate('friendId', 'displayName email photo')
    .sort({ createdAt: -1 });

    res.json({ 
      requests: requests.map(r => ({
        _id: r._id,
        user: r.friendId,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get received requests error:', error);
    res.status(500).json({ error: 'Failed to get received requests' });
  }
});

// Get sent friend requests
router.get('/requests/sent', requireAuth, async (req, res) => {
  try {
    const requests = await Friend.find({
      userId: req.user._id,
      status: 'pending',
      requestedBy: req.user._id
    })
    .populate('friendId', 'displayName email photo')
    .sort({ createdAt: -1 });

    res.json({ 
      requests: requests.map(r => ({
        _id: r._id,
        user: r.friendId,
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    console.error('Get sent requests error:', error);
    res.status(500).json({ error: 'Failed to get sent requests' });
  }
});

// Accept friend request
router.post('/request/:requestId/accept', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Friend.findOne({
      _id: requestId,
      userId: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update both directional records
    await Friend.updateMany(
      {
        $or: [
          { userId: req.user._id, friendId: request.friendId },
          { userId: request.friendId, friendId: req.user._id }
        ]
      },
      {
        status: 'accepted',
        updatedAt: new Date()
      }
    );

    // Send email notification to the requester
    const accepter = await User.findById(req.user._id);
    const requester = await User.findById(request.friendId);
    sendFriendRequestAcceptedNotification(accepter, requester).catch(err =>
      console.error('Failed to send friend request accepted email:', err)
    );

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Decline friend request
router.post('/request/:requestId/decline', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Friend.findOne({
      _id: requestId,
      userId: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Update both records to declined
    await Friend.updateMany(
      {
        $or: [
          { userId: req.user._id, friendId: request.friendId },
          { userId: request.friendId, friendId: req.user._id }
        ]
      },
      {
        status: 'declined',
        updatedAt: new Date()
      }
    );

    // Send email notification to the requester
    const decliner = await User.findById(req.user._id);
    const requester = await User.findById(request.friendId);
    sendFriendRequestDeclinedNotification(decliner, requester).catch(err =>
      console.error('Failed to send friend request declined email:', err)
    );

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Decline request error:', error);
    res.status(500).json({ error: 'Failed to decline request' });
  }
});

// Cancel sent friend request
router.delete('/request/:requestId/cancel', requireAuth, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Friend.findOne({
      _id: requestId,
      userId: req.user._id,
      requestedBy: req.user._id,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Delete both directional records
    await Friend.deleteMany({
      $or: [
        { userId: req.user._id, friendId: request.friendId },
        { userId: request.friendId, friendId: req.user._id }
      ],
      status: 'pending',
      requestedBy: req.user._id
    });

    res.json({ message: 'Friend request cancelled' });
  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// Remove friend
router.delete('/remove/:friendId', requireAuth, async (req, res) => {
  try {
    const { friendId } = req.params;

    await Friend.deleteMany({
      $or: [
        { userId: req.user._id, friendId },
        { userId: friendId, friendId: req.user._id }
      ]
    });

    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ error: 'Failed to remove friend' });
  }
});

module.exports = router;
