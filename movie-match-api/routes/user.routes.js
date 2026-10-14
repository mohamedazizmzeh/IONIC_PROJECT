const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, admin, ctrl.list);
router.patch('/:id/toggle-active', auth, admin, ctrl.toggleActive);
router.post('/favorites/:movieId', auth, ctrl.addFavorite);
router.delete('/favorites/:movieId', auth, ctrl.removeFavorite);
router.put('/photo', auth, ctrl.updatePhoto);

module.exports = router;