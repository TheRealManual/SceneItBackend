const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  overview: String,
  releaseDate: Date,
  runtime: Number,
  voteAverage: Number,
  voteCount: Number,
  popularity: Number,
  posterPath: String,
  backdropPath: String,
  genres: [{
    id: Number,
    name: String
  }],
  ageRating: String, // G, PG, PG-13, R, NC-17, NR
  language: String,
  budget: Number,
  revenue: Number,
  tagline: String,
  cast: [{
    name: String,
    character: String,
    profilePath: String
  }],
  director: String,
  keywords: [String],
  lastUpdated: { type: Date, default: Date.now }
});

// Indexes for efficient querying
movieSchema.index({ title: 'text', overview: 'text' });
movieSchema.index({ releaseDate: 1 });
movieSchema.index({ voteAverage: -1 });
movieSchema.index({ popularity: -1 });
movieSchema.index({ 'genres.name': 1 });
movieSchema.index({ ageRating: 1 });

module.exports = mongoose.model('Movie', movieSchema);
