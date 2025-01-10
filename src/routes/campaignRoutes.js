const express = require('express');
const router = express.Router();
const {
    createCampaign,
    getCampaigns,
    getCampaign,
    updateCampaign,
    deleteCampaign
} = require('../controllers/campaignController');
const auth = require('../middleware/auth');

// Public routes
router.get('/', getCampaigns);
router.get('/:id', getCampaign);

// Protected routes
router.post('/', auth, createCampaign);
router.put('/:id', auth, updateCampaign);
router.delete('/:id', auth, deleteCampaign);

module.exports = router;
