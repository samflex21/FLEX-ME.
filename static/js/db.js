// Moving db.js to static/js folder
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

// Database utility functions
const DB = {
    async getAllLocalData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const campaigns = JSON.parse(localStorage.getItem(`campaigns_${userData.id}`) || '[]');
        const donations = JSON.parse(localStorage.getItem(`donations_${userData.id}`) || '[]');
        const notifications = JSON.parse(localStorage.getItem(`notifications_${userData.id}`) || '[]');
        const messages = JSON.parse(localStorage.getItem(`messages_${userData.id}`) || '[]');
        const comments = JSON.parse(localStorage.getItem(`comments_${userData.id}`) || '[]');
        
        return {
            userData,
            campaigns,
            donations,
            notifications,
            messages,
            comments
        };
    },

    async clearLocalData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData.id) {
            localStorage.removeItem(`campaigns_${userData.id}`);
            localStorage.removeItem(`donations_${userData.id}`);
            localStorage.removeItem(`notifications_${userData.id}`);
            localStorage.removeItem(`messages_${userData.id}`);
            localStorage.removeItem(`comments_${userData.id}`);
            localStorage.removeItem(`metrics_${userData.id}`);
            localStorage.removeItem(`activities_${userData.id}`);
        }
    },

    async sendToServer(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error sending data to server:', error);
            throw error;
        }
    }
};

module.exports = {
    connectToDb,
    initializeDb,
    COLLECTIONS,
    client,
    DB
};
