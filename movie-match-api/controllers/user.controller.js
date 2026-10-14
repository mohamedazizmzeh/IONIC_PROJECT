const User = require('../models/User');

exports.list = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(u => ({
    id: u._id, firstName: u.firstName, lastName: u.lastName,
    age: u.age, email: u.email, photo: u.photo,
    role: u.role, active: u.active, favorites: u.favorites,
  })));
};

exports.toggleActive = async (req, res) => {
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ message: 'Utilisateur introuvable' });
  u.active = !u.active;
  await u.save();
  res.json({ id: u._id, active: u.active });
};

exports.addFavorite = async (req, res) => {
  const movieId = Number(req.params.movieId);
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { favorites: movieId }
  });
  const u = await User.findById(req.user._id);
  res.json({ favorites: u.favorites });
};

exports.removeFavorite = async (req, res) => {
  const movieId = Number(req.params.movieId);
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { favorites: movieId }
  });
  const u = await User.findById(req.user._id);
  res.json({ favorites: u.favorites });
};

exports.updatePhoto = async (req, res) => {
  const { photo } = req.body;
  if (!photo) return res.status(400).json({ message: 'Photo manquante' });
  if (photo.length > 900_000) return res.status(400).json({ message: 'Photo trop lourde' });
  req.user.photo = photo;
  await req.user.save();
  res.json({ photo: req.user.photo });
};