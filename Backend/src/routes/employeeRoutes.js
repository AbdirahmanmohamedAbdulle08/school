const express = require('express');
const router = express.Router();
const {
    getEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee
} = require('../controllers/employeeController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getEmployees)
    .post(protect, createEmployee);

router.route('/:id')
    .put(protect, updateEmployee)
    .delete(protect, deleteEmployee);

module.exports = router;
