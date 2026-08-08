const express = require('express');
const router = express.Router();
const {
    getBranchs,
    getBranchById,
    createBranch,
    updateBranch,
    deleteBranch
} = require('../controllers/branchController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getBranchs)
    .post(protect, createBranch);

router.route('/:id')
    .get(protect, getBranchById)
    .put(protect, updateBranch)
    .delete(protect, deleteBranch);

module.exports = router;
