const express = require('express');
const router = express.Router();
const {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
} = require('../controllers/roleController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getRoles)
    .post(protect, createRole);

router.route('/:id')
    .get(protect, getRoleById)
    .put(protect, updateRole)
    .delete(protect, deleteRole);

module.exports = router;
