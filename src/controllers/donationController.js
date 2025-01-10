const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// Create Donation
exports.createDonation = async (req, res) => {
    try {
        const { campaign: campaignId, amount, message, anonymous } = req.body;

        // Check campaign exists and is active
        const campaign = await Campaign.findOne({
            _id: campaignId,
            status: 'active'
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found or inactive' });
        }

        // Create donation
        const donation = await Donation.create({
            donor: req.user._id,
            campaign: campaignId,
            amount,
            message,
            anonymous
        });

        // Update campaign amount
        campaign.current_amount += amount;
        campaign.updateStatus();
        await campaign.save();

        // Update user's donations and points
        await User.findByIdAndUpdate(req.user._id, {
            $push: { donations_made: donation._id },
            $inc: { points: 50 } // 50 points per donation
        });

        res.status(201).json(donation);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get User's Donations
exports.getUserDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ donor: req.user._id })
            .populate('campaign', 'title target_amount current_amount')
            .sort('-createdAt');

        res.json(donations);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get Campaign Donations
exports.getCampaignDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ 
            campaign: req.params.campaignId,
            anonymous: false 
        })
            .populate('donor', 'username profile_image')
            .sort('-createdAt');

        res.json(donations);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
