import api from './api.js';
import { formatCurrency, formatDate, calculateProgress, showError } from '../utils.js';

class DashboardService {
    constructor() {
        this.campaignsContainer = document.getElementById('userCampaigns');
        this.donationsContainer = document.getElementById('userDonations');
        this.userStatsContainer = document.getElementById('userStats');
    }

    async loadDashboard() {
        try {
            const [profile, campaigns, donations] = await Promise.all([
                api.getProfile(),
                this.getUserCampaigns(),
                this.getUserDonations()
            ]);

            this.updateUserStats(profile);
            this.renderCampaigns(campaigns);
            this.renderDonations(donations);
            this.initializeCharts(campaigns, donations);
        } catch (error) {
            showError('Failed to load dashboard data');
            console.error('Dashboard loading error:', error);
        }
    }

    async getUserCampaigns() {
        try {
            return await api.getCampaigns({ creator: 'current' });
        } catch (error) {
            showError('Failed to load campaigns');
            return [];
        }
    }

    async getUserDonations() {
        try {
            return await api.getUserDonations();
        } catch (error) {
            showError('Failed to load donations');
            return [];
        }
    }

    updateUserStats(profile) {
        if (!this.userStatsContainer) return;

        const levelColor = this.getLevelColor(profile.level);
        this.userStatsContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>Level</h3>
                        <p style="color: ${levelColor}">${profile.level}</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>Points</h3>
                        <p>${profile.points}</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>Campaigns</h3>
                        <p>${profile.campaigns_created.length}</p>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <h3>Donations</h3>
                        <p>${profile.donations_made.length}</p>
                    </div>
                </div>
            </div>
        `;
    }

    renderCampaigns(campaigns) {
        if (!this.campaignsContainer) return;

        if (campaigns.length === 0) {
            this.campaignsContainer.innerHTML = `
                <div class="text-center my-5">
                    <h3>No campaigns yet</h3>
                    <p>Start your first campaign today!</p>
                    <a href="create-campaign.html" class="btn btn-primary">Create Campaign</a>
                </div>
            `;
            return;
        }

        this.campaignsContainer.innerHTML = campaigns.map(campaign => `
            <div class="campaign-card">
                <div class="campaign-header">
                    <h3>${campaign.title}</h3>
                    <span class="badge badge-${this.getStatusBadgeClass(campaign.status)}">
                        ${campaign.status}
                    </span>
                </div>
                <div class="campaign-body">
                    <div class="progress mb-3">
                        <div class="progress-bar" role="progressbar" 
                             style="width: ${calculateProgress(campaign.current_amount, campaign.target_amount)}%">
                        </div>
                    </div>
                    <div class="campaign-stats">
                        <div>
                            <strong>Raised:</strong> ${formatCurrency(campaign.current_amount)}
                        </div>
                        <div>
                            <strong>Goal:</strong> ${formatCurrency(campaign.target_amount)}
                        </div>
                        <div>
                            <strong>Deadline:</strong> ${formatDate(campaign.deadline)}
                        </div>
                    </div>
                </div>
                <div class="campaign-footer">
                    <a href="campaign-details.html?id=${campaign._id}" class="btn btn-outline-primary">View Details</a>
                    <button class="btn btn-outline-danger" 
                            onclick="deleteCampaign('${campaign._id}')">
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderDonations(donations) {
        if (!this.donationsContainer) return;

        if (donations.length === 0) {
            this.donationsContainer.innerHTML = `
                <div class="text-center my-5">
                    <h3>No donations yet</h3>
                    <p>Support a campaign to see your donations here!</p>
                    <a href="index.html#campaigns" class="btn btn-primary">Browse Campaigns</a>
                </div>
            `;
            return;
        }

        this.donationsContainer.innerHTML = donations.map(donation => `
            <div class="donation-card">
                <div class="donation-header">
                    <h4>${donation.campaign.title}</h4>
                    <span class="donation-amount">${formatCurrency(donation.amount)}</span>
                </div>
                <div class="donation-body">
                    <p class="donation-message">${donation.message || 'No message'}</p>
                    <small class="donation-date">${formatDate(donation.createdAt)}</small>
                </div>
                <div class="donation-footer">
                    <a href="campaign-details.html?id=${donation.campaign._id}" 
                       class="btn btn-sm btn-outline-primary">
                        View Campaign
                    </a>
                </div>
            </div>
        `).join('');
    }

    initializeCharts(campaigns, donations) {
        this.initializeCampaignChart(campaigns);
        this.initializeDonationChart(donations);
    }

    initializeCampaignChart(campaigns) {
        const ctx = document.getElementById('campaignChart');
        if (!ctx) return;

        const campaignData = campaigns.reduce((acc, campaign) => {
            acc.labels.push(campaign.title);
            acc.data.push(campaign.current_amount);
            return acc;
        }, { labels: [], data: [] });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: campaignData.labels,
                datasets: [{
                    label: 'Campaign Progress',
                    data: campaignData.data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    initializeDonationChart(donations) {
        const ctx = document.getElementById('donationChart');
        if (!ctx) return;

        const donationsByMonth = donations.reduce((acc, donation) => {
            const month = new Date(donation.createdAt).toLocaleString('default', { month: 'short' });
            acc[month] = (acc[month] || 0) + donation.amount;
            return acc;
        }, {});

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(donationsByMonth),
                datasets: [{
                    label: 'Monthly Donations',
                    data: Object.values(donationsByMonth),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    getStatusBadgeClass(status) {
        const classes = {
            'active': 'success',
            'completed': 'primary',
            'cancelled': 'danger'
        };
        return classes[status] || 'secondary';
    }

    getLevelColor(level) {
        const colors = {
            'Bronze': '#CD7F32',
            'Silver': '#C0C0C0',
            'Gold': '#FFD700',
            'Platinum': '#E5E4E2'
        };
        return colors[level] || '#CD7F32';
    }

    async deleteCampaign(campaignId) {
        if (!confirm('Are you sure you want to delete this campaign?')) {
            return;
        }

        try {
            await api.deleteCampaign(campaignId);
            showSuccess('Campaign deleted successfully');
            this.loadDashboard(); // Refresh dashboard data
        } catch (error) {
            showError('Failed to delete campaign');
        }
    }
}

export default new DashboardService();
