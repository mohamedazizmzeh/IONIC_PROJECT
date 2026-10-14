const router = require('express').Router();
const ctrl = require('../controllers/match.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.findMatches);

module.exports = router;