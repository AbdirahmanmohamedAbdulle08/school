const express = require('express');
const router = express.Router();
const {
    getTransactions,
    getTransactionById,
    createTransaction,
    updateTransaction,
    deleteTransaction
} = require('../controllers/transactionController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getTransactions)
    .post(protect, createTransaction);

router.route('/:id')
    .get(protect, getTransactionById)
    .put(protect, updateTransaction)
    .delete(protect, deleteTransaction);

module.exports = router;
