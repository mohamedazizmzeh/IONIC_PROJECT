const Movie = require('../models/Movie');

exports.list = async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
};

exports.create = async (req, res) => {
  try {
    const { tmdbId, title, overview, posterPath, releaseDate, voteAverage } = req.body;
    const exists = await Movie.findOne({ tmdbId });
    if (exists) return res.status(400).json({ message: 'Film déjà présent' });

    const movie = await Movie.create({
      tmdbId, title, overview, posterPath, releaseDate, voteAverage,
      addedBy: req.user._id.toString(),
    });
    res.status(201).json(movie);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  await Movie.findOneAndDelete({ tmdbId: req.params.id });
  res.json({ ok: true });
};