const express = require('express');
const router = express.Router();
const {
    getSalarys,
    getSalaryById,
    createSalary,
    updateSalary,
    deleteSalary
} = require('../controllers/salaryController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getSalarys)
    .post(protect, createSalary);

router.route('/:id')
    .get(protect, getSalaryById)
    .put(protect, updateSalary)
    .delete(protect, deleteSalary);

module.exports = router;
