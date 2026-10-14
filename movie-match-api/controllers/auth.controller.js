const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

exports.register = async (req, res) => {
  try {
    const { firstName, lastName, age, email, password, photo } = req.body;

    if (!firstName || !lastName || !age || !email || !password || !photo) {
      return res.status(400).json({ message: 'Champs manquants' });
    }
    if (photo.length > 900_000) {
      return res.status(400).json({ message: 'Photo trop lourde' });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName, lastName, age, email,
      password: hash, photo,
    });

    const token = signToken(user._id);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: 'Identifiants invalides' });

    if (!user.active) return res.status(403).json({ message: 'Compte désactivé' });

    const token = signToken(user._id);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  res.json(sanitize(req.user));
};

function sanitize(u) {
  return {
    id: u._id, firstName: u.firstName, lastName: u.lastName,
    age: u.age, email: u.email, photo: u.photo,
    role: u.role, active: u.active, favorites: u.favorites,
  };
}