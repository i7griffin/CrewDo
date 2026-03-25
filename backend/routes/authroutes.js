const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, refreshToken, logout, getMe } = require('../controllers/authcontroller');
const { protect } = require('../middleware/authmiddleware');

const registerRules = [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('Username must be 3–20 chars'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register', registerRules, register);
router.post('/login', loginRules, login);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;
