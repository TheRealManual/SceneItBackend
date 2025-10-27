const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  displayName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  photo: {
    type: String
  },
  preferences: {
    yearRange: {
      type: [Number],
      default: [1980, 2024]
    },
    ratingRange: {
      type: [Number],
      default: [0, 10]
    },
    genres: {
      type: [String],
      default: []
    }
  },
  likedMovies: [{
    movieId: {
      type: String,
      required: true
    },
    title: String,
    posterPath: String,
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dislikedMovies: [{
    movieId: {
      type: String,
      required: true
    },
    title: String,
    posterPath: String,
    dislikedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update lastActive on any update
userSchema.pre('save', function(next) {
  this.lastActive = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);
