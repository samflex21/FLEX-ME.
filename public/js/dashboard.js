import dashboardService from './services/dashboard.js';
import { showError } from './utils.js';

// Load and display user's campaigns
function loadUserCampaigns() {
    dashboardService.getUserCampaigns('my');
}

// Load and display user statistics
function loadUserStats() {
    dashboardService.loadUserStats();
}

// Calculate campaign success rate
function calculateSuccessRate(campaigns) {
    if (!campaigns.length) return 0;
    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    const successfulCampaigns = completedCampaigns.filter(c => c.currentAmount >= c.targetAmount);
    return Math.round((successfulCampaigns.length / completedCampaigns.length) * 100) || 0;
}

// Edit campaign
function editCampaign(campaignId) {
    // Store campaign ID for editing
    localStorage.setItem('editCampaignId', campaignId);
    window.location.href = 'edit-campaign.html';
}

// Delete campaign
function deleteCampaign(campaignId) {
    dashboardService.deleteCampaign(campaignId);
}

// Filter campaigns
function filterCampaigns(status) {
    dashboardService.getUserCampaigns(status);
}

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Check if user is logged in via API service
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Load dashboard data
        await dashboardService.loadDashboard();

        // Initialize event listeners
        initializeEventListeners();
    } catch (error) {
        showError('Failed to initialize dashboard');
        console.error('Dashboard initialization error:', error);
    }
});

// Initialize event listeners
function initializeEventListeners() {
    // Campaign filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const status = button.dataset.status;
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            dashboardService.getUserCampaigns(status);
        });
    });

    // Date range filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            const range = dateFilter.value;
            dashboardService.filterByDate(range);
        });
    }
}

// Export functions for global access (if needed)
window.deleteCampaign = (campaignId) => dashboardService.deleteCampaign(campaignId);
