const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');

            // Get user from the token
            const userId = decoded.id || decoded._id || decoded.userId;
            let user = null;

            if (userId) {
                try {
                    user = await User.findById(userId).select('-passwordHash').populate('roles');
                } catch (dbErr) {
                    console.error('Error querying user in DB:', dbErr.message);
                }
            }

            if (!user) {
                res.status(401);
                throw new Error('User not found. Please log in again.');
            }

            req.user = user;
            next();
        } catch (error) {
            console.error('Auth verification error:', error.message);
            res.status(401);

            if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
                throw new Error('Not authorized, token failed or expired');
            }

            if (error.message.includes('User not found') || error.message.includes('Not authorized')) {
                throw error;
            }

            throw new Error(`Not authorized, error verifying user: ${error.message}`);
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token');
    }
});

module.exports = { protect };

