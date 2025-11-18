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
    favoritedAt: {
      type: Date,
      default: Date.now
    }
  }],
  watchedMovies: [{
    movieId: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: function(v) {
          // Allow only increments of 0.5 (1, 1.5, 2, 2.5, etc.)
          return v * 2 === Math.floor(v * 2);
        },
        message: 'Rating must be in increments of 0.5 (1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5)'
      }
    },
    watchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  lastActive: {
    type: Date,
    default: Date.now
  },
  emailPreferences: {
    type: {
      unsubscribedFromRecommendations: {
        type: Boolean,
        default: false
      },
      unsubscribedAt: {
        type: Date
      }
    },
    default: () => ({
      unsubscribedFromRecommendations: false,
      unsubscribedAt: null
    })
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
