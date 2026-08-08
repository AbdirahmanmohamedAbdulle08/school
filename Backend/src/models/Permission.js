const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true, // Permissions are usually global system keys
        trim: true
    },
    description: String,
    module: {
        type: String, // e.g., 'Inventory', 'Sales', 'Users'
        required: true
    },
    action: {
        type: String, // e.g., 'create', 'read', 'update', 'delete'
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Permission', permissionSchema);
