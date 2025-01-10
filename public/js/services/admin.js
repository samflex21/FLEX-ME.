import api from './api.js';
import { showError, showSuccess, formatDate, formatCurrency } from '../utils.js';
import { Chart } from 'chart.js/auto';

class AdminService {
    constructor() {
        this.campaignsTable = document.getElementById('campaignsTable');
        this.usersTable = document.getElementById('usersTable');
        this.reportsTable = document.getElementById('reportsTable');
        this.dashboardStats = document.getElementById('adminDashboardStats');
        this.currentSection = 'dashboard';
        this.charts = {};
    }

    async initialize() {
        try {
            await this.loadDashboard();
            this.setupNavigation();
            this.setupSearch();
            this.setupFilters();
            this.setupBulkActions();
        } catch (error) {
            showError('Failed to initialize admin dashboard');
            console.error('Admin initialization error:', error);
        }
    }

    async loadDashboard() {
        try {
            const [
                stats,
                recentCampaigns,
                recentUsers,
                recentReports,
                analyticsData
            ] = await Promise.all([
                api.getAdminStats(),
                api.getRecentCampaigns(),
                api.getRecentUsers(),
                api.getRecentReports(),
                api.getAnalyticsData()
            ]);

            this.renderDashboardStats(stats);
            this.renderRecentCampaigns(recentCampaigns);
            this.renderRecentUsers(recentUsers);
            this.renderRecentReports(recentReports);
            this.initializeCharts(analyticsData);
            this.setupChartFilters();
        } catch (error) {
            showError('Failed to load dashboard data');
        }
    }

    renderDashboardStats(stats) {
        if (!this.dashboardStats) return;

        this.dashboardStats.innerHTML = `
            <div class="row">
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Total Campaigns</h6>
                            <h3>${stats.total_campaigns}</h3>
                            <p class="trend ${stats.campaigns_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${stats.campaigns_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.campaigns_trend)}% from last month
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Total Users</h6>
                            <h3>${stats.total_users}</h3>
                            <p class="trend ${stats.users_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${stats.users_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.users_trend)}% from last month
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Total Donations</h6>
                            <h3>${formatCurrency(stats.total_donations)}</h3>
                            <p class="trend ${stats.donations_trend > 0 ? 'up' : 'down'}">
                                <i class="fas fa-arrow-${stats.donations_trend > 0 ? 'up' : 'down'}"></i>
                                ${Math.abs(stats.donations_trend)}% from last month
                            </p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-card-body">
                            <h6>Active Reports</h6>
                            <h3>${stats.active_reports}</h3>
                            <p class="text-warning">
                                <i class="fas fa-exclamation-triangle"></i>
                                Requires attention
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadCampaigns(page = 1, filters = {}) {
        try {
            const campaigns = await api.getAdminCampaigns(page, filters);
            this.renderCampaignsTable(campaigns.data);
            this.updatePagination(campaigns.pagination, 'campaigns');
        } catch (error) {
            showError('Failed to load campaigns');
        }
    }

    async loadUsers(page = 1, filters = {}) {
        try {
            const users = await api.getAdminUsers(page, filters);
            this.renderUsersTable(users.data);
            this.updatePagination(users.pagination, 'users');
        } catch (error) {
            showError('Failed to load users');
        }
    }

    async loadReports(page = 1, filters = {}) {
        try {
            const reports = await api.getAdminReports(page, filters);
            this.renderReportsTable(reports.data);
            this.updatePagination(reports.pagination, 'reports');
        } catch (error) {
            showError('Failed to load reports');
        }
    }

    renderCampaignsTable(campaigns) {
        if (!this.campaignsTable) return;

        const tbody = this.campaignsTable.querySelector('tbody');
        tbody.innerHTML = campaigns.map(campaign => `
            <tr>
                <td>
                    <input type="checkbox" class="select-item" value="${campaign._id}">
                </td>
                <td>${campaign.title}</td>
                <td>${campaign.creator.username}</td>
                <td>${formatCurrency(campaign.current_amount)} / ${formatCurrency(campaign.target_amount)}</td>
                <td><span class="badge badge-${this.getStatusBadgeClass(campaign.status)}">${campaign.status}</span></td>
                <td>${formatDate(campaign.createdAt)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewCampaign('${campaign._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="editCampaign('${campaign._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteCampaign('${campaign._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderUsersTable(users) {
        if (!this.usersTable) return;

        const tbody = this.usersTable.querySelector('tbody');
        tbody.innerHTML = users.map(user => `
            <tr>
                <td>
                    <input type="checkbox" class="select-item" value="${user._id}">
                </td>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || 'images/default-avatar.jpg'}" 
                             alt="${user.username}"
                             class="user-avatar rounded-circle">
                        ${user.username}
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <span class="badge badge-${user.status === 'active' ? 'success' : 'danger'}">
                        ${user.status}
                    </span>
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewUser('${user._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="editUser('${user._id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="banUser('${user._id}')">
                            <i class="fas fa-ban"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderReportsTable(reports) {
        if (!this.reportsTable) return;

        const tbody = this.reportsTable.querySelector('tbody');
        tbody.innerHTML = reports.map(report => `
            <tr>
                <td>
                    <input type="checkbox" class="select-item" value="${report._id}">
                </td>
                <td>${report.type}</td>
                <td>${report.reporter.username}</td>
                <td>${report.reported_item.type}: ${report.reported_item.title}</td>
                <td>${report.reason}</td>
                <td>
                    <span class="badge badge-${this.getReportStatusBadgeClass(report.status)}">
                        ${report.status}
                    </span>
                </td>
                <td>${formatDate(report.createdAt)}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewReport('${report._id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success" onclick="resolveReport('${report._id}')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="dismissReport('${report._id}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.admin-nav-link');
        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('adminSearch');
        searchInput?.addEventListener('input', this.debounce(() => {
            const searchTerm = searchInput.value;
            const filters = { search: searchTerm };
            
            switch (this.currentSection) {
                case 'campaigns':
                    this.loadCampaigns(1, filters);
                    break;
                case 'users':
                    this.loadUsers(1, filters);
                    break;
                case 'reports':
                    this.loadReports(1, filters);
                    break;
            }
        }, 300));
    }

    setupFilters() {
        const filterForm = document.getElementById('adminFilters');
        filterForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(filterForm);
            const filters = Object.fromEntries(formData.entries());
            
            switch (this.currentSection) {
                case 'campaigns':
                    this.loadCampaigns(1, filters);
                    break;
                case 'users':
                    this.loadUsers(1, filters);
                    break;
                case 'reports':
                    this.loadReports(1, filters);
                    break;
            }
        });
    }

    setupBulkActions() {
        const bulkActionForm = document.getElementById('bulkActionForm');
        bulkActionForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const action = document.getElementById('bulkAction').value;
            const selectedItems = Array.from(document.querySelectorAll('.select-item:checked'))
                .map(checkbox => checkbox.value);

            if (selectedItems.length === 0) {
                showError('Please select items to perform bulk action');
                return;
            }

            try {
                await api.performBulkAction(this.currentSection, action, selectedItems);
                showSuccess('Bulk action completed successfully');
                this.refreshCurrentSection();
            } catch (error) {
                showError('Failed to perform bulk action');
            }
        });
    }

    switchSection(section) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(s => {
            s.style.display = 'none';
        });

        // Show selected section
        const selectedSection = document.getElementById(`${section}Section`);
        if (selectedSection) {
            selectedSection.style.display = 'block';
        }

        // Update navigation
        document.querySelectorAll('.admin-nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        this.currentSection = section;
        this.refreshCurrentSection();
    }

    refreshCurrentSection() {
        switch (this.currentSection) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'campaigns':
                this.loadCampaigns();
                break;
            case 'users':
                this.loadUsers();
                break;
            case 'reports':
                this.loadReports();
                break;
        }
    }

    updatePagination(pagination, section) {
        const paginationElement = document.getElementById(`${section}Pagination`);
        if (!paginationElement) return;

        const { current_page, total_pages } = pagination;
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${current_page === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page - 1}">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= total_pages; i++) {
            if (
                i === 1 || 
                i === total_pages || 
                (i >= current_page - 2 && i <= current_page + 2)
            ) {
                paginationHTML += `
                    <li class="page-item ${i === current_page ? 'active' : ''}">
                        <a class="page-link" href="#" data-page="${i}">${i}</a>
                    </li>
                `;
            } else if (
                i === current_page - 3 || 
                i === current_page + 3
            ) {
                paginationHTML += `
                    <li class="page-item disabled">
                        <span class="page-link">...</span>
                    </li>
                `;
            }
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${current_page === total_pages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${current_page + 1}">Next</a>
            </li>
        `;

        paginationElement.innerHTML = paginationHTML;

        // Add click handlers
        paginationElement.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (isNaN(page)) return;

                switch (section) {
                    case 'campaigns':
                        this.loadCampaigns(page);
                        break;
                    case 'users':
                        this.loadUsers(page);
                        break;
                    case 'reports':
                        this.loadReports(page);
                        break;
                }
            });
        });
    }

    getStatusBadgeClass(status) {
        const classes = {
            'active': 'success',
            'completed': 'primary',
            'cancelled': 'danger',
            'suspended': 'warning'
        };
        return classes[status] || 'secondary';
    }

    getReportStatusBadgeClass(status) {
        const classes = {
            'pending': 'warning',
            'resolved': 'success',
            'dismissed': 'danger'
        };
        return classes[status] || 'secondary';
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    initializeCharts(data) {
        // Donation Overview Chart
        this.createChart('donationChart', {
            type: 'line',
            data: {
                labels: data.donations.labels,
                datasets: [{
                    label: 'Donations',
                    data: data.donations.values,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.1)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Daily Donations'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '$' + value
                        }
                    }
                }
            }
        });

        // Campaign Categories Chart
        this.createChart('categoryChart', {
            type: 'doughnut',
            data: {
                labels: data.categories.labels,
                datasets: [{
                    data: data.categories.values,
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

        // User Growth Chart
        this.createChart('userGrowthChart', {
            type: 'line',
            data: {
                labels: data.userGrowth.labels,
                datasets: [{
                    label: 'New Users',
                    data: data.userGrowth.values,
                    borderColor: 'rgb(54, 162, 235)',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });

        // Campaign Success Rate Chart
        this.createChart('successRateChart', {
            type: 'pie',
            data: {
                labels: ['Successful', 'In Progress', 'Failed'],
                datasets: [{
                    data: [
                        data.campaignStats.successful,
                        data.campaignStats.inProgress,
                        data.campaignStats.failed
                    ],
                    backgroundColor: [
                        'rgb(75, 192, 192)',
                        'rgb(255, 205, 86)',
                        'rgb(255, 99, 132)'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });

        // Platform Activity Chart
        this.createChart('activityChart', {
            type: 'bar',
            data: {
                labels: data.activity.labels,
                datasets: [{
                    label: 'Comments',
                    data: data.activity.comments,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }, {
                    label: 'Donations',
                    data: data.activity.donations,
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                }, {
                    label: 'Shares',
                    data: data.activity.shares,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    setupChartFilters() {
        const donationTimeRange = document.getElementById('donationTimeRange');
        donationTimeRange?.addEventListener('change', async () => {
            const days = donationTimeRange.value;
            try {
                const data = await api.getDonationData(days);
                this.updateDonationChart(data);
            } catch (error) {
                showError('Failed to update donation chart');
            }
        });
    }

    updateDonationChart(data) {
        const chart = this.charts['donationChart'];
        if (!chart) return;

        chart.data.labels = data.labels;
        chart.data.datasets[0].data = data.values;
        chart.update();
    }

    createChart(id, config) {
        const ctx = document.getElementById(id).getContext('2d');
        this.charts[id] = new Chart(ctx, config);
    }
}

export default new AdminService();
