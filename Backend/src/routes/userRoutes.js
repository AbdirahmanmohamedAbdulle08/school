const express = require('express');
const router = express.Router();
const {
    registerUser,
    authUser,
    getUserProfile,
    getUsers,
    updateUser,
    deleteUser
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);

router.post('/', protect, checkPermission('Users & Access', 'Add', 'Users'), registerUser); // Create User
router.get('/', protect, checkPermission('Users & Access', 'Read', 'Users'), getUsers);      // List Users
router.route('/:id')
    .put(protect, checkPermission('Users & Access', 'Edit', 'Users'), updateUser)
    .delete(protect, checkPermission('Users & Access', 'Delete', 'Users'), deleteUser);

module.exports = router;
