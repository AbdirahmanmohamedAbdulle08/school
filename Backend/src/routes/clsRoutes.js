const express = require('express');
const router = express.Router();
const {
    getClasss,
    getClassById,
    createClass,
    updateClass,
    deleteClass
} = require('../controllers/clsController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getClasss)
    .post(protect, createClass);

router.route('/:id')
    .get(protect, getClassById)
    .put(protect, updateClass)
    .delete(protect, deleteClass);

module.exports = router;
