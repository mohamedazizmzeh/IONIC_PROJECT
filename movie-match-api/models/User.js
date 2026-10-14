const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  age:       { type: Number, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, select: false },
  photo:     { type: String, required: true },   // base64 dataURL
  role:      { type: String, enum: ['user', 'admin'], default: 'user' },
  active:    { type: Boolean, default: true },
  favorites: { type: [Number], default: [] },     // tmdbIds
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);