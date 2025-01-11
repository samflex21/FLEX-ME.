// Function to migrate data from localStorage to MongoDB
async function migrateToMongoDB() {
    try {
        // Get all users from localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        // Send users data to server for migration
        const response = await fetch('/api/migrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ users })
        });
        
        if (!response.ok) {
            throw new Error('Migration failed');
        }
        
        const result = await response.json();
        console.log('Migration successful:', result);
        
        // Optionally clear localStorage after successful migration
        // localStorage.clear();
        
        return true;
    } catch (error) {
        console.error('Migration failed:', error);
        return false;
    }
}

// Migration utility functions
async function checkMigrationStatus() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (!userData.id) return false;

    try {
        const response = await fetch('/api/check-migration-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: userData.id })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const { needsMigration } = await response.json();
        return needsMigration;
    } catch (error) {
        console.error('Error checking migration status:', error);
        return false;
    }
}

async function migrateToMongoDBNew() {
    try {
        // Get all local data
        const localData = await DB.getAllLocalData();
        
        // Send data to server for migration
        const result = await DB.sendToServer('/api/migrate', localData);
        
        if (result.success) {
            // Clear local storage after successful migration
            await DB.clearLocalData();
            return true;
        } else {
            throw new Error('Migration failed on server');
        }
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Add migration endpoint to app.py
async function checkMigrationStatusOld() {
    try {
        const response = await fetch('/api/migration-status');
        const data = await response.json();
        return data.migrated;
    } catch (error) {
        console.error('Failed to check migration status:', error);
        return false;
    }
}

// Check if we need to migrate when the app starts
document.addEventListener('DOMContentLoaded', async () => {
    const isMigrated = await checkMigrationStatusOld();
    if (!isMigrated) {
        const shouldMigrate = confirm('Would you like to migrate your data to the new database system?');
        if (shouldMigrate) {
            const success = await migrateToMongoDB();
            if (success) {
                alert('Data migration successful!');
            } else {
                alert('Data migration failed. Please try again later.');
            }
        }
    }
});

// Export functions
window.checkMigrationStatus = checkMigrationStatus;
window.migrateToMongoDB = migrateToMongoDBNew;
