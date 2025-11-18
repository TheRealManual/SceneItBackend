const mongoose = require('mongoose');

const movieFeedbackSchema = new mongoose.Schema({
  movieId: {
    type: Number,
    required: true
  },
  feedback: {
    type: String,
    enum: ['good', 'bad'],
    required: true
  }
});

const gameRatingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  movieFeedback: [movieFeedbackSchema],
  gameMovies: [{
    type: Number  // Array of movie IDs that were in the game
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
gameRatingSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('GameRating', gameRatingSchema);
