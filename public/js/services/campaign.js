import api from './api.js';
import { formatCurrency, formatDate, calculateProgress, showError, showSuccess } from '../utils.js';

class CampaignService {
    constructor() {
        this.campaignForm = document.getElementById('campaignForm');
        this.imagePreview = document.getElementById('imagePreview');
        this.campaignDetails = document.getElementById('campaignDetails');
        this.donationsList = document.getElementById('donationsList');
    }

    async initializeCreateForm() {
        try {
            // Load categories for dropdown
            const categories = await this.getCategories();
            this.populateCategoryDropdown(categories);

            // Set minimum date for deadline
            const deadlineInput = document.getElementById('deadline');
            if (deadlineInput) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                deadlineInput.min = tomorrow.toISOString().split('T')[0];
            }

            // Initialize form submission
            this.campaignForm?.addEventListener('submit', (e) => this.handleCreateSubmit(e));

            // Initialize image upload preview
            const imageInput = document.getElementById('campaignImage');
            imageInput?.addEventListener('change', (e) => this.handleImagePreview(e));
        } catch (error) {
            showError('Failed to initialize campaign form');
        }
    }

    async initializeDetailsPage() {
        try {
            const campaignId = new URLSearchParams(window.location.search).get('id');
            if (!campaignId) {
                showError('Campaign ID not found');
                return;
            }

            const campaign = await api.getCampaign(campaignId);
            this.renderCampaignDetails(campaign);
            this.initializeDonationForm(campaign);
            this.loadDonations(campaignId);
        } catch (error) {
            showError('Failed to load campaign details');
        }
    }

    async handleCreateSubmit(event) {
        event.preventDefault();

        try {
            const formData = new FormData(this.campaignForm);
            const campaignData = {
                title: formData.get('title'),
                description: formData.get('description'),
                target_amount: parseFloat(formData.get('target_amount')),
                deadline: formData.get('deadline'),
                category: formData.get('category')
            };

            // Handle image upload
            const imageFile = formData.get('image');
            if (imageFile.size > 0) {
                const imageUrl = await this.uploadImage(imageFile);
                campaignData.images = [imageUrl];
            }

            const campaign = await api.createCampaign(campaignData);
            showSuccess('Campaign created successfully!');
            window.location.href = `campaign-details.html?id=${campaign._id}`;
        } catch (error) {
            showError('Failed to create campaign');
        }
    }

    async handleDonation(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const donationData = {
                amount: parseFloat(formData.get('amount')),
                message: formData.get('message'),
                anonymous: formData.get('anonymous') === 'on',
                campaign: formData.get('campaign_id')
            };

            await api.createDonation(donationData);
            showSuccess('Thank you for your donation!');
            this.loadDonations(donationData.campaign);
            event.target.reset();
        } catch (error) {
            showError('Failed to process donation');
        }
    }

    renderCampaignDetails(campaign) {
        if (!this.campaignDetails) return;

        const progress = calculateProgress(campaign.current_amount, campaign.target_amount);
        const daysLeft = Math.max(0, Math.ceil((new Date(campaign.deadline) - new Date()) / (1000 * 60 * 60 * 24)));

        this.campaignDetails.innerHTML = `
            <div class="campaign-header">
                <h1>${campaign.title}</h1>
                <span class="badge badge-${this.getStatusBadgeClass(campaign.status)}">
                    ${campaign.status}
                </span>
            </div>

            <div class="campaign-images">
                ${campaign.images.map(image => `
                    <img src="${image}" alt="Campaign image" class="img-fluid rounded">
                `).join('')}
            </div>

            <div class="campaign-progress mt-4">
                <div class="progress">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${progress}%" 
                         aria-valuenow="${progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${progress}%
                    </div>
                </div>

                <div class="campaign-stats mt-3">
                    <div class="stat">
                        <h4>${formatCurrency(campaign.current_amount)}</h4>
                        <p>raised of ${formatCurrency(campaign.target_amount)} goal</p>
                    </div>
                    <div class="stat">
                        <h4>${campaign.donors.length}</h4>
                        <p>donors</p>
                    </div>
                    <div class="stat">
                        <h4>${daysLeft}</h4>
                        <p>days left</p>
                    </div>
                </div>
            </div>

            <div class="campaign-description mt-4">
                <h3>About this campaign</h3>
                <p>${campaign.description}</p>
            </div>

            <div class="campaign-creator mt-4">
                <h3>Campaign Creator</h3>
                <div class="creator-info">
                    <img src="${campaign.creator.profile_image || 'default-avatar.png'}" 
                         alt="${campaign.creator.username}" 
                         class="rounded-circle">
                    <div>
                        <h4>${campaign.creator.username}</h4>
                        <p>Member since ${formatDate(campaign.creator.createdAt)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    async loadDonations(campaignId) {
        try {
            const donations = await api.getCampaignDonations(campaignId);
            this.renderDonations(donations);
        } catch (error) {
            showError('Failed to load donations');
        }
    }

    renderDonations(donations) {
        if (!this.donationsList) return;

        if (donations.length === 0) {
            this.donationsList.innerHTML = `
                <div class="text-center my-5">
                    <p>No donations yet. Be the first to donate!</p>
                </div>
            `;
            return;
        }

        this.donationsList.innerHTML = donations.map(donation => `
            <div class="donation-item">
                <div class="donor-info">
                    ${donation.anonymous ? `
                        <span class="anonymous-donor">Anonymous Donor</span>
                    ` : `
                        <img src="${donation.donor.profile_image || 'default-avatar.png'}" 
                             alt="${donation.donor.username}" 
                             class="rounded-circle">
                        <span>${donation.donor.username}</span>
                    `}
                </div>
                <div class="donation-details">
                    <span class="donation-amount">${formatCurrency(donation.amount)}</span>
                    <p class="donation-message">${donation.message || 'No message'}</p>
                    <small class="donation-date">${formatDate(donation.createdAt)}</small>
                </div>
            </div>
        `).join('');
    }

    handleImagePreview(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('Please select an image file');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.imagePreview.innerHTML = `
                <img src="${e.target.result}" class="img-fluid rounded" alt="Campaign preview">
            `;
        };
        reader.readAsDataURL(file);
    }

    async uploadImage(file) {
        // Implement image upload to your server or a cloud service
        // Return the URL of the uploaded image
        // This is a placeholder
        return 'default-campaign-image.jpg';
    }

    populateCategoryDropdown(categories) {
        const categorySelect = document.getElementById('category');
        if (!categorySelect) return;

        categorySelect.innerHTML = categories.map(category => `
            <option value="${category._id}">${category.name}</option>
        `).join('');
    }

    getStatusBadgeClass(status) {
        const classes = {
            'active': 'success',
            'completed': 'primary',
            'cancelled': 'danger'
        };
        return classes[status] || 'secondary';
    }

    async getCategories() {
        try {
            return await api.getCategories();
        } catch (error) {
            showError('Failed to load categories');
            return [];
        }
    }
}

export default new CampaignService();
