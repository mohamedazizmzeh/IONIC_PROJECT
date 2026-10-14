const router = require('express').Router();
const ctrl = require('../controllers/movie.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', auth, ctrl.list);
router.post('/', auth, admin, ctrl.create);
router.delete('/:id', auth, admin, ctrl.remove);

module.exports = router;