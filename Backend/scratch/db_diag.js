require('dotenv').config();
const mongoose = require('mongoose');

const listCollections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\nCollections in database:');
        collections.forEach(c => console.log(`- ${c.name}`));
        
        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
};

listCollections();
