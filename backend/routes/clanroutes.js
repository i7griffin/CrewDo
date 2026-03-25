const router = require('express').Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/authmiddleware');
const {
  createClan,
  joinClan,
  leaveClan,
  getMyClan,
  getClanById,
  searchClans,
  updateDailyTask,
  transferLeadership,
  getStreakHistory,
  getLeaderboard,
} = require('../controllers/clancontrollers');

const createClanRules = [
  body('name').trim().isLength({ min: 3, max: 30 }).withMessage('Clan name must be 3–30 chars'),
  body('dailyTask.title').trim().notEmpty().withMessage('Daily task title is required'),
];

router.use(protect); // All clan routes require auth

router.get('/leaderboard', getLeaderboard);
router.get('/search', searchClans);
router.get('/my', getMyClan);
router.get('/:id', getClanById);
router.get('/:id/streak-history', getStreakHistory);

router.post('/', createClanRules, createClan);
router.post('/join', joinClan);
router.delete('/leave', leaveClan);
router.patch('/:id/task', updateDailyTask);
router.patch('/:id/transfer', transferLeadership);

module.exports = router;
