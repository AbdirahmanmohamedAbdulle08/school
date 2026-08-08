const express = require('express');
const router = express.Router();
const {
    getAccounts,
    createAccount,
    getAccountById,
    updateAccount,
    deleteAccount,
    seedAccounts
} = require('../controllers/accountController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getAccounts).post(protect, createAccount);
router.post('/seed', protect, seedAccounts);
router.route('/:id').get(protect, getAccountById).put(protect, updateAccount).delete(protect, deleteAccount);

module.exports = router;
