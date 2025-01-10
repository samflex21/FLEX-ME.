const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        content: String,
        created_at: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// After comment is saved, create activity and notification
commentSchema.post('save', async function(doc) {
    try {
        // Get campaign creator
        const campaign = await mongoose.model('Campaign').findById(doc.campaign);
        
        // Create activity
        await mongoose.model('Activity').create({
            user: doc.user,
            activity_type: 'comment',
            campaign: doc.campaign,
            details: {
                content: doc.content.substring(0, 100) // First 100 characters
            }
        });

        // Create notification for campaign creator
        if (campaign.creator.toString() !== doc.user.toString()) {
            await mongoose.model('Notification').create({
                user: campaign.creator,
                type: 'comment',
                message: 'Someone commented on your campaign',
                campaign: doc.campaign
            });
        }
    } catch (error) {
        console.error('Error in comment post-save hook:', error);
    }
});

module.exports = mongoose.model('Comment', commentSchema);
