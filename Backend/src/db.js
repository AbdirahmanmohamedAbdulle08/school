const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const shouldUseInMemoryFallback = (env = process.env) => {
    return env.NODE_ENV !== 'production';
};

const buildMongoConnectionTargets = (env = process.env) => {
    const targets = [];
    const explicitUri = env.MONGO_URI?.trim();

    if (explicitUri) {
        targets.push(explicitUri);
    }

    if (env.NODE_ENV !== 'production') {
        targets.push('mongodb://127.0.0.1:27017/machad');
    }

    if (shouldUseInMemoryFallback(env)) {
        targets.push('__memory__');
    }

    return targets;
};

const connectToMemoryDB = async () => {
    if (!memoryServer) {
        memoryServer = await MongoMemoryServer.create();
    }

    return memoryServer.getUri();
};

const connectDB = async (retries = 5) => {
    const targets = buildMongoConnectionTargets();

    for (let attempt = 1; attempt <= retries; attempt++) {
        for (const target of targets) {
            try {
                const uri = target === '__memory__' ? await connectToMemoryDB() : target;
                console.log(`MongoDB connection attempt ${attempt}/${retries} using ${target === '__memory__' ? 'in-memory MongoDB' : target}...`);

                const conn = await mongoose.connect(uri, {
                    serverSelectionTimeoutMS: 10000,
                    socketTimeoutMS: 45000,
                    family: 4,
                });

                console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
                return conn;
            } catch (error) {
                console.error(`✗ Attempt ${attempt} failed for ${target === '__memory__' ? 'in-memory MongoDB' : target}: ${error.message}`);
                if (target === '__memory__') {
                    memoryServer = null;
                }
            }
        }

        if (attempt < retries) {
            const wait = attempt * 3000;
            console.log(`  Retrying in ${wait / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
    }

    console.error('✗ All connection attempts failed.');
    throw new Error('Unable to connect to MongoDB.');
};

module.exports = connectDB;
module.exports.buildMongoConnectionTargets = buildMongoConnectionTargets;
module.exports.shouldUseInMemoryFallback = shouldUseInMemoryFallback;
