const express = require('express');
const router = express.Router();
const {
    getWallets,
    getWalletById,
    createWallet,
    updateWallet,
    deleteWallet
} = require('../controllers/walletController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getWallets)
    .post(protect, createWallet);

router.route('/:id')
    .get(protect, getWalletById)
    .put(protect, updateWallet)
    .delete(protect, deleteWallet);

module.exports = router;
