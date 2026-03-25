const router = require('express').Router();
const { protect } = require('../middleware/authmiddleware');
const { uploadProof } = require('../config/cloudinary');
const {
  submitProof,
  approveProof,
  rejectProof,
  getPendingProofs,
  getClanProofs,
  getMyProofs,
  getTodayFeed,
  deleteProof,
} = require('../controllers/proofcontroller');

router.use(protect);

// Feed & history
router.get('/today', getTodayFeed);
router.get('/my', getMyProofs);
router.get('/pending', getPendingProofs);
router.get('/clan/:clanId', getClanProofs);

// Submission
router.post('/submit', uploadProof.single('proof'), submitProof);
router.delete('/:id', deleteProof);

// Verification (leader actions)
router.post('/:id/approve', approveProof);
router.post('/:id/reject', rejectProof);

module.exports = router;
