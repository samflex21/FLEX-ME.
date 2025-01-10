// Switch to FLEX_ME database
use FLEX_ME;

// 1. Users Collection
db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["username", "email", "password_hash", "created_at"],
            properties: {
                username: { bsonType: "string" },
                email: { bsonType: "string" },
                password_hash: { bsonType: "string" },
                first_name: { bsonType: "string" },
                last_name: { bsonType: "string" },
                profile_image: { bsonType: "string" },
                level: { bsonType: "string", enum: ["Bronze", "Silver", "Gold", "Platinum"] },
                points: { bsonType: "int" },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});

// 2. Campaigns Collection
db.createCollection("campaigns", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["title", "description", "creator_id", "target_amount", "current_amount", "status", "created_at"],
            properties: {
                title: { bsonType: "string" },
                description: { bsonType: "string" },
                creator_id: { bsonType: "objectId" },
                target_amount: { bsonType: "double" },
                current_amount: { bsonType: "double" },
                status: { bsonType: "string", enum: ["active", "completed", "cancelled"] },
                deadline: { bsonType: "date" },
                category: { bsonType: "string" },
                images: { bsonType: "array", items: { bsonType: "string" } },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});

// 3. Donations Collection
db.createCollection("donations", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["donor_id", "campaign_id", "amount", "created_at"],
            properties: {
                donor_id: { bsonType: "objectId" },
                campaign_id: { bsonType: "objectId" },
                amount: { bsonType: "double" },
                message: { bsonType: "string" },
                anonymous: { bsonType: "bool" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// 4. Comments Collection
db.createCollection("comments", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["user_id", "campaign_id", "content", "created_at"],
            properties: {
                user_id: { bsonType: "objectId" },
                campaign_id: { bsonType: "objectId" },
                content: { bsonType: "string" },
                created_at: { bsonType: "date" },
                updated_at: { bsonType: "date" }
            }
        }
    }
});

// 5. Activities Collection (User Activity Feed)
db.createCollection("activities", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["user_id", "activity_type", "created_at"],
            properties: {
                user_id: { bsonType: "objectId" },
                activity_type: { bsonType: "string", enum: ["donation", "campaign_create", "level_up", "comment"] },
                campaign_id: { bsonType: "objectId" },
                details: { bsonType: "object" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// 6. Messages Collection (Contact Form Messages)
db.createCollection("messages", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "email", "subject", "message", "created_at"],
            properties: {
                name: { bsonType: "string" },
                email: { bsonType: "string" },
                subject: { bsonType: "string" },
                message: { bsonType: "string" },
                status: { bsonType: "string", enum: ["new", "read", "replied"] },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// 7. Notifications Collection
db.createCollection("notifications", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["user_id", "type", "message", "created_at"],
            properties: {
                user_id: { bsonType: "objectId" },
                type: { bsonType: "string", enum: ["donation", "comment", "level_up", "campaign_complete"] },
                message: { bsonType: "string" },
                read: { bsonType: "bool" },
                campaign_id: { bsonType: "objectId" },
                created_at: { bsonType: "date" }
            }
        }
    }
});

// 8. UserLevels Collection
db.createCollection("user_levels", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["level", "min_points", "max_points", "benefits"],
            properties: {
                level: { bsonType: "string", enum: ["Bronze", "Silver", "Gold", "Platinum"] },
                min_points: { bsonType: "int" },
                max_points: { bsonType: "int" },
                benefits: { bsonType: "array", items: { bsonType: "string" } },
                max_campaign_amount: { bsonType: "double" },
                max_donation_amount: { bsonType: "double" }
            }
        }
    }
});

// 9. Categories Collection
db.createCollection("categories", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "description"],
            properties: {
                name: { bsonType: "string" },
                description: { bsonType: "string" },
                icon: { bsonType: "string" },
                active: { bsonType: "bool" },
                campaign_count: { bsonType: "int" }
            }
        }
    }
});

// 10. Reports Collection
db.createCollection("reports", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["reporter_id", "reported_type", "reason", "created_at"],
            properties: {
                reporter_id: { bsonType: "objectId" },
                reported_type: { bsonType: "string", enum: ["campaign", "comment", "user"] },
                reported_id: { bsonType: "objectId" },
                reason: { bsonType: "string" },
                details: { bsonType: "string" },
                status: { bsonType: "string", enum: ["pending", "reviewed", "resolved"] },
                created_at: { bsonType: "date" },
                resolved_at: { bsonType: "date" }
            }
        }
    }
});

// Insert initial data for UserLevels
db.user_levels.insertMany([
    {
        level: "Bronze",
        min_points: 0,
        max_points: 999,
        benefits: [
            "Can create campaigns up to $1,000",
            "Can donate up to $1,000 per donation"
        ],
        max_campaign_amount: 1000,
        max_donation_amount: 1000
    },
    {
        level: "Silver",
        min_points: 1000,
        max_points: 4999,
        benefits: [
            "Can create campaigns up to $5,000",
            "Can donate up to $5,000 per donation",
            "Priority support"
        ],
        max_campaign_amount: 5000,
        max_donation_amount: 5000
    },
    {
        level: "Gold",
        min_points: 5000,
        max_points: 9999,
        benefits: [
            "Can create campaigns up to $10,000",
            "Can donate up to $10,000 per donation",
            "Priority support",
            "Featured campaigns"
        ],
        max_campaign_amount: 10000,
        max_donation_amount: 10000
    },
    {
        level: "Platinum",
        min_points: 10000,
        max_points: 999999,
        benefits: [
            "Can create campaigns up to $50,000",
            "Can donate up to $50,000 per donation",
            "Priority support",
            "Featured campaigns",
            "Early access to new features"
        ],
        max_campaign_amount: 50000,
        max_donation_amount: 50000
    }
]);

// Insert initial categories
db.categories.insertMany([
    {
        name: "Education",
        description: "Educational campaigns including tuition, books, and school supplies",
        icon: "fas fa-graduation-cap",
        active: true,
        campaign_count: 0
    },
    {
        name: "Medical",
        description: "Medical expenses, treatments, and healthcare needs",
        icon: "fas fa-hospital",
        active: true,
        campaign_count: 0
    },
    {
        name: "Emergency",
        description: "Urgent needs and emergency situations",
        icon: "fas fa-exclamation-circle",
        active: true,
        campaign_count: 0
    },
    {
        name: "Community",
        description: "Community projects and local initiatives",
        icon: "fas fa-users",
        active: true,
        campaign_count: 0
    },
    {
        name: "Business",
        description: "Small business and entrepreneurship support",
        icon: "fas fa-store",
        active: true,
        campaign_count: 0
    }
]);
