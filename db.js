const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'flex_me';

// Collections
const COLLECTIONS = {
    USERS: 'users',
    CAMPAIGNS: 'campaigns',
    DONATIONS: 'donations',
    TESTIMONIALS: 'testimonials',
    NEWS: 'news'
};

async function connectToDb() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const db = client.db(dbName);
        return db;
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err);
        throw err;
    }
}

// Initialize collections with indexes
async function initializeDb() {
    try {
        const db = await connectToDb();
        
        // Users collection indexes
        await db.collection(COLLECTIONS.USERS).createIndex({ username: 1 }, { unique: true });
        await db.collection(COLLECTIONS.USERS).createIndex({ email: 1 }, { unique: true });
        
        // Campaigns collection indexes
        await db.collection(COLLECTIONS.CAMPAIGNS).createIndex({ creator: 1 });
        await db.collection(COLLECTIONS.CAMPAIGNS).createIndex({ status: 1 });
        
        // Donations collection indexes
        await db.collection(COLLECTIONS.DONATIONS).createIndex({ campaignId: 1 });
        await db.collection(COLLECTIONS.DONATIONS).createIndex({ donorId: 1 });
        
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Failed to initialize database:', err);
        throw err;
    }
}

module.exports = {
    connectToDb,
    initializeDb,
    COLLECTIONS,
    client
};
