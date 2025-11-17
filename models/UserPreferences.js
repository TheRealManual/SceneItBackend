const mongoose = require('mongoose');

const UserPreferencesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  favoriteGenres: [{
    type: String
  }],
  likedMovies: [{
    title: String,
    genre: String,
    rating: Number
  }],
  emailOptIn: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserPreferences', UserPreferencesSchema);
