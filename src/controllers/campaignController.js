const Campaign = require('../models/Campaign');
const User = require('../models/User');

// Create Campaign
exports.createCampaign = async (req, res) => {
    try {
        const campaign = new Campaign({
            ...req.body,
            creator: req.user._id
        });

        await campaign.save();
        
        // Update user's campaigns
        await User.findByIdAndUpdate(req.user._id, {
            $push: { campaigns_created: campaign._id }
        });

        res.status(201).json(campaign);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get All Campaigns
exports.getCampaigns = async (req, res) => {
    try {
        const { category, status, sort = '-createdAt' } = req.query;
        const query = {};

        if (category) query.category = category;
        if (status) query.status = status;

        const campaigns = await Campaign.find(query)
            .sort(sort)
            .populate('creator', 'username profile_image')
            .populate('category', 'name');

        res.json(campaigns);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get Single Campaign
exports.getCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findById(req.params.id)
            .populate('creator', 'username profile_image')
            .populate('category')
            .populate('donors.user', 'username profile_image')
            .populate({
                path: 'comments',
                populate: { path: 'user', select: 'username profile_image' }
            });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        res.json(campaign);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Update Campaign
exports.updateCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findOne({
            _id: req.params.id,
            creator: req.user._id
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        Object.assign(campaign, req.body);
        await campaign.save();

        res.json(campaign);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete Campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const campaign = await Campaign.findOneAndDelete({
            _id: req.params.id,
            creator: req.user._id
        });

        if (!campaign) {
            return res.status(404).json({ error: 'Campaign not found' });
        }

        // Remove campaign from user's campaigns
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { campaigns_created: campaign._id }
        });

        res.json({ message: 'Campaign deleted successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
