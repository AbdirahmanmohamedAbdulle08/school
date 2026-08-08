const express = require('express');
const router = express.Router();
const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getEntries,
    createEntry,
    updateEntry,
    deleteEntry,
    lookupPhone,
    getPayers,
    togglePayer
} = require('../controllers/cashbookController');
const { protect } = require('../middleware/authMiddleware');

router.get('/lookup', protect, lookupPhone);
router.get('/payers', protect, getPayers);
router.post('/payers/toggle', protect, togglePayer);

router.route('/categories')
    .get(protect, getCategories)
    .post(protect, createCategory);

router.route('/categories/:id')
    .put(protect, updateCategory)
    .delete(protect, deleteCategory);

router.route('/entries')
    .get(protect, getEntries)
    .post(protect, createEntry);

router.route('/entries/:id')
    .put(protect, updateEntry)
    .delete(protect, deleteEntry);

module.exports = router;
