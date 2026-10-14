const User = require('../models/User');

function jaccard(a, b) {
  const A = new Set(a), B = new Set(b);
  if (A.size === 0 || B.size === 0) return 0;
  let inter = 0;
  A.forEach(x => { if (B.has(x)) inter++; });
  const union = A.size + B.size - inter;
  return (inter / union) * 100;
}

exports.findMatches = async (req, res) => {
  const threshold = Number(req.query.threshold) || 75;
  const me = req.user;

  console.log('=== 🔍 MATCHING DEBUG ===');
  console.log('Utilisateur connecté:', me.email);
  console.log('Ses favoris:', me.favorites);

  const others = await User.find({
    _id: { $ne: me._id },
    active: true,
    favorites: { $exists: true, $ne: [] }
  });

  console.log('Nombre d\'autres users actifs:', others.length);

  const results = others
    .map(u => {
      const score = jaccard(me.favorites, u.favorites);
      const common = me.favorites.filter(id => u.favorites.includes(id)).length;
      console.log(`  → ${u.email} | favoris: [${u.favorites}] | score: ${score.toFixed(0)}% | communs: ${common}`);
      return {
        user: {
          id: u._id,
          firstName: u.firstName,
          lastName: u.lastName,
          photo: u.photo,
          age: u.age,
        },
        score: Math.round(score),
        common,
      };
    })
    .filter(m => m.score >= threshold)
    .sort((a, b) => b.score - a.score);

  console.log('✅ Matchs retenus:', results.length);
  console.log('=========================');

  res.json(results);
};