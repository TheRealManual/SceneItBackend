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
    description: {
      type: String,
      default: ''
    },
    yearRange: {
      type: [Number],
      default: [1950, 2025]
    },
    runtimeRange: {
      type: [Number],
      default: [60, 180]
    },
    ratingRange: {
      type: [Number],
      default: [1, 10]
    },
    ageRating: {
      type: String,
      default: 'Any'
    },
    moodIntensity: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    humorLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    violenceLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    romanceLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    complexityLevel: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    },
    genres: {
      type: Map,
      of: Number,
      default: new Map()
    },
    language: {
      type: String,
      default: 'English'
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
  favoriteMovies: [{
    movieId: {
      type: String,
      required: true
    },
    title: String,
    posterPath: String,
    favoritedAt: {
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
