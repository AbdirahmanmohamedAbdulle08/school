const express = require('express');
const router = express.Router();
const {
    getGuardians,
    getGuardianById,
    createGuardian,
    updateGuardian,
    deleteGuardian
} = require('../controllers/guardianController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getGuardians)
    .post(protect, createGuardian);

router.route('/:id')
    .get(protect, getGuardianById)
    .put(protect, updateGuardian)
    .delete(protect, deleteGuardian);

module.exports = router;
