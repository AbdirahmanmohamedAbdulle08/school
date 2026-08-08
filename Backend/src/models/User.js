const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    branchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Super Admin', 'Institute Admin', 'Branch Manager', 'Teacher', 'Accountant'],
        default: 'Teacher'
    },
    roles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    }],
    salary: {
        type: Number,
        default: 0
    },
    gender: {
        type: String,
        enum: ['Male', 'Female'],
        default: 'Male'
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { strictPopulate: false });

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    try {
        if (!this.passwordHash || this.passwordHash === '123456') {
            return enteredPassword === this.passwordHash; 
        }
        return await bcrypt.compare(enteredPassword, this.passwordHash);
    } catch (error) {
        console.error('Bcrypt comparison error:', error.message);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);
