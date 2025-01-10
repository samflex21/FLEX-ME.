const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Donation amount is required'],
        min: [1, 'Donation amount must be greater than 0']
    },
    message: String,
    anonymous: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// After donation is saved, update campaign and user
donationSchema.post('save', async function(doc) {
    try {
        // Update campaign amount
        await mongoose.model('Campaign').findByIdAndUpdate(
            doc.campaign,
            { $inc: { current_amount: doc.amount } }
        );

        // Update user points (50 points per donation)
        await mongoose.model('User').findByIdAndUpdate(
            doc.donor,
            { $inc: { points: 50 } }
        );

        // Create activity
        await mongoose.model('Activity').create({
            user: doc.donor,
            activity_type: 'donation',
            campaign: doc.campaign,
            details: {
                amount: doc.amount,
                anonymous: doc.anonymous
            }
        });
    } catch (error) {
        console.error('Error in donation post-save hook:', error);
    }
});

module.exports = mongoose.model('Donation', donationSchema);
