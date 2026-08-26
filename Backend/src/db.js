const mongoose = require('mongoose');

const DEFAULT_MONGO_URI = 'mongodb+srv://abdirahmanmohamedabdulle08_db_user:Hl8CPd6i5P4jUpxL@cluster0.tkrjnos.mongodb.net/school_db?retryWrites=true&w=majority&appName=Cluster0';

const connectDB = async () => {
    const uri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
    try {
        console.log('Connecting to MongoDB Atlas...');
        const conn = await mongoose.connect(uri);
        console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`✗ MongoDB Connection Error: ${error.message}`);
        throw error;
    }
};

module.exports = connectDB;
module.exports.DEFAULT_MONGO_URI = DEFAULT_MONGO_URI;
