// Load and display user's campaigns
function loadUserCampaigns() {
    const campaigns = getCampaigns('my');
    const campaignsContainer = document.querySelector('.campaigns-container');
    
    if (!campaigns.length) {
        campaignsContainer.innerHTML = `
            <div class="no-campaigns">
                <h3>No Campaigns Yet</h3>
                <p>Start your first campaign today!</p>
                <a href="create-campaign.html" class="btn btn-primary">Create Campaign</a>
            </div>
        `;
        return;
    }

    const campaignsHTML = campaigns.map(campaign => `
        <div class="campaign-card">
            <div class="campaign-image">
                <img src="${campaign.images[0] || 'images/default-campaign.jpg'}" alt="${campaign.title}">
            </div>
            <div class="campaign-content">
                <h3>${campaign.title}</h3>
                <p>${campaign.description.substring(0, 100)}...</p>
                <div class="campaign-progress">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${(campaign.currentAmount / campaign.targetAmount) * 100}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>€${campaign.currentAmount} raised</span>
                        <span>of €${campaign.targetAmount}</span>
                    </div>
                </div>
                <div class="campaign-footer">
                    <span class="status ${campaign.status}">${campaign.status}</span>
                    <div class="campaign-actions">
                        <button onclick="editCampaign(${campaign.id})" class="btn btn-sm btn-outline-primary">Edit</button>
                        <button onclick="deleteCampaign(${campaign.id})" class="btn btn-sm btn-outline-danger">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    campaignsContainer.innerHTML = campaignsHTML;
}

// Load and display user statistics
function loadUserStats() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    const campaigns = getCampaigns('my');
    const stats = {
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'active').length,
        totalRaised: campaigns.reduce((sum, c) => sum + (c.currentAmount || 0), 0),
        successRate: calculateSuccessRate(campaigns)
    };

    // Update stats in the UI
    document.getElementById('totalCampaigns').textContent = stats.totalCampaigns;
    document.getElementById('activeCampaigns').textContent = stats.activeCampaigns;
    document.getElementById('totalRaised').textContent = `€${stats.totalRaised}`;
    document.getElementById('successRate').textContent = `${stats.successRate}%`;
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
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    let campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    campaigns = campaigns.filter(c => c.id !== campaignId);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));

    // Refresh the display
    loadUserCampaigns();
    loadUserStats();
    showSuccess('Campaign deleted successfully');
}

// Filter campaigns
function filterCampaigns(status) {
    const campaigns = getCampaigns(status);
    const campaignsContainer = document.querySelector('.campaigns-container');
    
    // Update active filter
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${status}"]`).classList.add('active');

    // Display filtered campaigns
    if (!campaigns.length) {
        campaignsContainer.innerHTML = `
            <div class="no-campaigns">
                <p>No ${status} campaigns found.</p>
            </div>
        `;
        return;
    }

    const campaignsHTML = campaigns.map(campaign => `
        <div class="campaign-card">
            <div class="campaign-image">
                <img src="${campaign.images[0] || 'images/default-campaign.jpg'}" alt="${campaign.title}">
            </div>
            <div class="campaign-content">
                <h3>${campaign.title}</h3>
                <p>${campaign.description.substring(0, 100)}...</p>
                <div class="campaign-progress">
                    <div class="progress">
                        <div class="progress-bar" style="width: ${(campaign.currentAmount / campaign.targetAmount) * 100}%"></div>
                    </div>
                    <div class="progress-stats">
                        <span>€${campaign.currentAmount} raised</span>
                        <span>of €${campaign.targetAmount}</span>
                    </div>
                </div>
                <div class="campaign-footer">
                    <span class="status ${campaign.status}">${campaign.status}</span>
                    <div class="campaign-actions">
                        <button onclick="editCampaign(${campaign.id})" class="btn btn-sm btn-outline-primary">Edit</button>
                        <button onclick="deleteCampaign(${campaign.id})" class="btn btn-sm btn-outline-danger">Delete</button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    campaignsContainer.innerHTML = campaignsHTML;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Load initial data
    loadUserCampaigns();
    loadUserStats();
    checkAuthStatus();

    // Add filter button handlers
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterCampaigns(this.dataset.filter);
        });
    });
});
