const express = require('express');
const router = express.Router();
const {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getPayments)
    .post(protect, createPayment);

router.route('/:id')
    .get(protect, getPaymentById)
    .put(protect, updatePayment)
    .delete(protect, deletePayment);

module.exports = router;
