require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
    const client = new MongoClient(process.env.MONGO_URI);
    try {
        await client.connect();
        console.log('Connected successfully to server');
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log('Collections:');
        collections.forEach(c => console.log(`- ${c.name}`));
    } finally {
        await client.close();
    }
}

main().catch(console.error);
