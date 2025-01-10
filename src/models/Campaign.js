const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Campaign title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Campaign description is required']
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    target_amount: {
        type: Number,
        required: [true, 'Target amount is required'],
        min: [1, 'Target amount must be greater than 0']
    },
    current_amount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    deadline: {
        type: Date,
        required: [true, 'Campaign deadline is required']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    images: [{
        type: String
    }],
    donors: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        amount: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual field for progress percentage
campaignSchema.virtual('progress').get(function() {
    return (this.current_amount / this.target_amount) * 100;
});

// Virtual field for days left
campaignSchema.virtual('days_left').get(function() {
    const now = new Date();
    const timeDiff = this.deadline.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
});

// Update campaign status based on amount and deadline
campaignSchema.methods.updateStatus = function() {
    const now = new Date();
    if (this.current_amount >= this.target_amount) {
        this.status = 'completed';
    } else if (now > this.deadline) {
        this.status = 'cancelled';
    }
};

module.exports = mongoose.model('Campaign', campaignSchema);
