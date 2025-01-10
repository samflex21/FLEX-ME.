import api from './api.js';
import { showError, showSuccess, formatCurrency, formatDate } from '../utils.js';

class DonationService {
    constructor() {
        this.donationForm = document.getElementById('donationForm');
        this.donationsList = document.getElementById('donationsList');
        this.donationStats = document.getElementById('donationStats');
        this.donationModal = document.getElementById('donationModal');
    }

    async initialize(campaignId) {
        try {
            await this.loadDonations(campaignId);
            this.setupDonationForm(campaignId);
            this.setupAmountPresets();
            this.initializePaymentElements();
        } catch (error) {
            showError('Failed to initialize donation system');
            console.error('Donation initialization error:', error);
        }
    }

    async loadDonations(campaignId) {
        try {
            const donations = await api.getCampaignDonations(campaignId);
            this.renderDonations(donations);
            this.updateDonationStats(donations);
        } catch (error) {
            showError('Failed to load donations');
        }
    }

    setupDonationForm(campaignId) {
        this.donationForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleDonation(e, campaignId);
        });
    }

    setupAmountPresets() {
        const presetButtons = document.querySelectorAll('.amount-preset');
        const customAmount = document.getElementById('customAmount');

        presetButtons?.forEach(button => {
            button.addEventListener('click', () => {
                presetButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                if (customAmount) {
                    customAmount.value = button.dataset.amount;
                }
            });
        });

        // Handle custom amount input
        customAmount?.addEventListener('input', () => {
            presetButtons.forEach(btn => btn.classList.remove('active'));
        });
    }

    initializePaymentElements() {
        // Initialize payment gateway elements (e.g., Stripe)
        // This is a placeholder - implement according to your payment provider
    }

    async handleDonation(event, campaignId) {
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const loadingSpinner = form.querySelector('.spinner-border');

        try {
            submitButton.disabled = true;
            loadingSpinner.style.display = 'inline-block';

            const formData = new FormData(form);
            const donationData = {
                amount: parseFloat(formData.get('amount')),
                message: formData.get('message'),
                anonymous: formData.get('anonymous') === 'on',
                campaign: campaignId
            };

            // Validate amount
            if (isNaN(donationData.amount) || donationData.amount < 1) {
                throw new Error('Please enter a valid donation amount');
            }

            // Process payment
            const paymentResult = await this.processPayment(donationData);
            
            // Create donation record
            const donation = await api.createDonation({
                ...donationData,
                payment_id: paymentResult.id
            });

            showSuccess('Thank you for your donation!');
            
            // Refresh donations list and stats
            await this.loadDonations(campaignId);
            
            // Close modal if exists
            if (this.donationModal) {
                const modal = bootstrap.Modal.getInstance(this.donationModal);
                modal?.hide();
            }

            // Reset form
            form.reset();
        } catch (error) {
            showError(error.message || 'Failed to process donation');
        } finally {
            submitButton.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    async processPayment(donationData) {
        // Implement payment processing logic here
        // This is a placeholder - implement according to your payment provider
        return { id: 'mock_payment_id' };
    }

    renderDonations(donations) {
        if (!this.donationsList) return;

        if (donations.length === 0) {
            this.donationsList.innerHTML = `
                <div class="text-center my-4">
                    <p>No donations yet. Be the first to support this campaign!</p>
                </div>
            `;
            return;
        }

        this.donationsList.innerHTML = donations.map(donation => `
            <div class="donation-card">
                <div class="donation-header">
                    ${donation.anonymous ? `
                        <div class="donor-info">
                            <i class="fas fa-user-circle"></i>
                            <span>Anonymous Donor</span>
                        </div>
                    ` : `
                        <div class="donor-info">
                            <img src="${donation.donor.profile_image || 'images/default-avatar.jpg'}" 
                                 alt="${donation.donor.username}"
                                 class="donor-avatar">
                            <span>${donation.donor.username}</span>
                        </div>
                    `}
                    <div class="donation-amount">
                        ${formatCurrency(donation.amount)}
                    </div>
                </div>
                ${donation.message ? `
                    <div class="donation-message">
                        <p>${donation.message}</p>
                    </div>
                ` : ''}
                <div class="donation-footer">
                    <small class="text-muted">
                        <i class="far fa-clock"></i>
                        ${formatDate(donation.createdAt)}
                    </small>
                </div>
            </div>
        `).join('');
    }

    updateDonationStats(donations) {
        if (!this.donationStats) return;

        const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
        const uniqueDonors = new Set(donations.map(d => d.donor._id)).size;
        const averageDonation = totalAmount / donations.length || 0;

        this.donationStats.innerHTML = `
            <div class="row">
                <div class="col-md-4">
                    <div class="stat-card">
                        <h4>Total Raised</h4>
                        <p>${formatCurrency(totalAmount)}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <h4>Donors</h4>
                        <p>${uniqueDonors}</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="stat-card">
                        <h4>Average Donation</h4>
                        <p>${formatCurrency(averageDonation)}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

export default new DonationService();
