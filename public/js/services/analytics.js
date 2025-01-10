import api from './api.js';
import { formatCurrency, formatDate } from '../utils.js';

class AnalyticsService {
    constructor() {
        this.charts = {};
    }

    async initialize(campaignId) {
        try {
            const [
                overview,
                donations,
                traffic,
                engagement
            ] = await Promise.all([
                api.getCampaignAnalytics(campaignId, 'overview'),
                api.getCampaignAnalytics(campaignId, 'donations'),
                api.getCampaignAnalytics(campaignId, 'traffic'),
                api.getCampaignAnalytics(campaignId, 'engagement')
            ]);

            this.renderOverview(overview);
            this.renderDonationCharts(donations);
            this.renderTrafficCharts(traffic);
            this.renderEngagementCharts(engagement);
            this.setupDateRangeFilter();
            this.setupExportOptions();
        } catch (error) {
            console.error('Analytics initialization error:', error);
        }
    }

    renderOverview(data) {
        const overviewContainer = document.getElementById('analyticsOverview');
        if (!overviewContainer) return;

        overviewContainer.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Total Raised</h6>
                            <h3>${formatCurrency(data.total_raised)}</h3>
                            <p class="trend ${data.raised_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${data.raised_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(data.raised_trend)}% from last period
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Total Donors</h6>
                            <h3>${data.total_donors}</h3>
                            <p class="trend ${data.donors_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${data.donors_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(data.donors_trend)}% from last period
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Page Views</h6>
                            <h3>${data.page_views}</h3>
                            <p class="trend ${data.views_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${data.views_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(data.views_trend)}% from last period
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Conversion Rate</h6>
                            <h3>${data.conversion_rate}%</h3>
                            <p class="trend ${data.conversion_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${data.conversion_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(data.conversion_trend)}% from last period
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDonationCharts(data) {
        // Donations over time
        this.createChart('donationsTimeChart', {
            type: 'line',
            data: {
                labels: data.timeline.map(item => formatDate(item.date)),
                datasets: [{
                    label: 'Donations',
                    data: data.timeline.map(item => item.amount),
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

        // Donation amount distribution
        this.createChart('donationDistributionChart', {
            type: 'bar',
            data: {
                labels: data.distribution.map(item => `${formatCurrency(item.range_start)} - ${formatCurrency(item.range_end)}`),
                datasets: [{
                    label: 'Number of Donations',
                    data: data.distribution.map(item => item.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderTrafficCharts(data) {
        // Traffic sources
        this.createChart('trafficSourcesChart', {
            type: 'doughnut',
            data: {
                labels: data.sources.map(item => item.source),
                datasets: [{
                    data: data.sources.map(item => item.count),
                    backgroundColor: [
                        'rgb(255, 99, 132)',
                        'rgb(54, 162, 235)',
                        'rgb(255, 205, 86)',
                        'rgb(75, 192, 192)',
                        'rgb(153, 102, 255)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Geographic distribution
        this.createChart('geoDistributionChart', {
            type: 'bar',
            data: {
                labels: data.locations.map(item => item.country),
                datasets: [{
                    label: 'Visitors',
                    data: data.locations.map(item => item.count),
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgb(75, 192, 192)',
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true
            }
        });
    }

    renderEngagementCharts(data) {
        // Engagement metrics
        this.createChart('engagementChart', {
            type: 'radar',
            data: {
                labels: ['Views', 'Shares', 'Comments', 'Likes', 'Time on Page'],
                datasets: [{
                    label: 'Current Period',
                    data: [
                        data.current.views,
                        data.current.shares,
                        data.current.comments,
                        data.current.likes,
                        data.current.avg_time
                    ],
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgb(54, 162, 235)'
                }, {
                    label: 'Previous Period',
                    data: [
                        data.previous.views,
                        data.previous.shares,
                        data.previous.comments,
                        data.previous.likes,
                        data.previous.avg_time
                    ],
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgb(255, 99, 132)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createChart(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        // Destroy existing chart if it exists
        if (this.charts[canvasId]) {
            this.charts[canvasId].destroy();
        }

        this.charts[canvasId] = new Chart(canvas, config);
    }

    setupDateRangeFilter() {
        const dateRange = document.getElementById('dateRange');
        if (!dateRange) return;

        dateRange.addEventListener('change', async () => {
            const campaignId = new URLSearchParams(window.location.search).get('id');
            if (!campaignId) return;

            try {
                const [
                    overview,
                    donations,
                    traffic,
                    engagement
                ] = await Promise.all([
                    api.getCampaignAnalytics(campaignId, 'overview', dateRange.value),
                    api.getCampaignAnalytics(campaignId, 'donations', dateRange.value),
                    api.getCampaignAnalytics(campaignId, 'traffic', dateRange.value),
                    api.getCampaignAnalytics(campaignId, 'engagement', dateRange.value)
                ]);

                this.renderOverview(overview);
                this.renderDonationCharts(donations);
                this.renderTrafficCharts(traffic);
                this.renderEngagementCharts(engagement);
            } catch (error) {
                console.error('Failed to update analytics:', error);
            }
        });
    }

    setupExportOptions() {
        const exportBtn = document.getElementById('exportAnalytics');
        if (!exportBtn) return;

        exportBtn.addEventListener('click', async () => {
            const campaignId = new URLSearchParams(window.location.search).get('id');
            if (!campaignId) return;

            try {
                const format = document.getElementById('exportFormat').value;
                const dateRange = document.getElementById('dateRange').value;
                
                const response = await api.exportAnalytics(campaignId, format, dateRange);
                
                // Create download link
                const blob = new Blob([response.data], { type: response.type });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `campaign-analytics-${campaignId}.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Failed to export analytics:', error);
            }
        });
    }

    // Helper method to format numbers
    formatNumber(number) {
        if (number >= 1000000) {
            return (number / 1000000).toFixed(1) + 'M';
        } else if (number >= 1000) {
            return (number / 1000).toFixed(1) + 'K';
        }
        return number.toString();
    }
}

export default new AnalyticsService();
