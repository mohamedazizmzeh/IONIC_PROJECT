const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  tmdbId:      { type: Number, required: true, unique: true },
  title:       { type: String, required: true },
  overview:    { type: String, default: '' },
  posterPath:  { type: String, default: '' },
  releaseDate: { type: String, default: '' },
  voteAverage: { type: Number, default: 0 },
  addedBy:     { type: String, default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);