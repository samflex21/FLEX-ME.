const express = require('express');
const router = express.Router();
const {
    createDonation,
    getUserDonations,
    getCampaignDonations
} = require('../controllers/donationController');
const auth = require('../middleware/auth');

// All routes are protected
router.use(auth);

router.post('/', createDonation);
router.get('/user', getUserDonations);
router.get('/campaign/:campaignId', getCampaignDonations);

module.exports = router;
