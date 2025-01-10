import api from './api.js';
import { showError, showSuccess, validateForm } from '../utils.js';

class CampaignFormService {
    constructor() {
        this.form = document.getElementById('campaignForm');
        this.imagePreview = document.getElementById('imagePreview');
        this.imageInput = document.getElementById('campaignImage');
        this.titleInput = document.getElementById('title');
        this.descriptionInput = document.getElementById('description');
        this.targetAmountInput = document.getElementById('targetAmount');
        this.deadlineInput = document.getElementById('deadline');
        this.categorySelect = document.getElementById('category');
        this.submitButton = document.getElementById('submitButton');
        this.loadingSpinner = document.getElementById('loadingSpinner');
    }

    async initialize(campaignId = null) {
        try {
            await this.loadCategories();
            this.setupImagePreview();
            this.setupFormValidation();
            this.setupDeadlineValidation();

            if (campaignId) {
                await this.loadCampaignData(campaignId);
            }

            this.form?.addEventListener('submit', (e) => this.handleSubmit(e, campaignId));
        } catch (error) {
            showError('Failed to initialize campaign form');
            console.error('Form initialization error:', error);
        }
    }

    async loadCategories() {
        try {
            const categories = await api.getCategories();
            if (this.categorySelect) {
                this.categorySelect.innerHTML = `
                    <option value="">Select a category</option>
                    ${categories.map(category => `
                        <option value="${category._id}">${category.name}</option>
                    `).join('')}
                `;
            }
        } catch (error) {
            showError('Failed to load categories');
        }
    }

    setupImagePreview() {
        this.imageInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showError('Please select an image file');
                e.target.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (this.imagePreview) {
                    this.imagePreview.innerHTML = `
                        <img src="${event.target.result}" 
                             class="img-fluid rounded" 
                             alt="Campaign preview">
                        <button type="button" class="btn btn-sm btn-danger remove-image">
                            Remove Image
                        </button>
                    `;

                    this.imagePreview.querySelector('.remove-image')?.addEventListener('click', () => {
                        this.imageInput.value = '';
                        this.imagePreview.innerHTML = `
                            <div class="upload-placeholder">
                                <i class="fas fa-cloud-upload-alt"></i>
                                <p>Click to upload or drag and drop</p>
                                <p class="small">Maximum file size: 5MB</p>
                            </div>
                        `;
                    });
                }
            };
            reader.readAsDataURL(file);
        });
    }

    setupFormValidation() {
        const inputs = this.form?.querySelectorAll('input, textarea, select');
        inputs?.forEach(input => {
            input.addEventListener('input', () => {
                this.validateField(input);
            });

            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
    }

    setupDeadlineValidation() {
        if (this.deadlineInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.deadlineInput.min = tomorrow.toISOString().split('T')[0];

            this.deadlineInput.addEventListener('input', () => {
                const selectedDate = new Date(this.deadlineInput.value);
                const maxDate = new Date();
                maxDate.setMonth(maxDate.getMonth() + 6);

                if (selectedDate < tomorrow) {
                    this.showFieldError(this.deadlineInput, 'Deadline must be at least tomorrow');
                } else if (selectedDate > maxDate) {
                    this.showFieldError(this.deadlineInput, 'Deadline cannot be more than 6 months in the future');
                } else {
                    this.clearFieldError(this.deadlineInput);
                }
            });
        }
    }

    async loadCampaignData(campaignId) {
        try {
            const campaign = await api.getCampaign(campaignId);
            
            if (this.titleInput) this.titleInput.value = campaign.title;
            if (this.descriptionInput) this.descriptionInput.value = campaign.description;
            if (this.targetAmountInput) this.targetAmountInput.value = campaign.target_amount;
            if (this.deadlineInput) this.deadlineInput.value = campaign.deadline.split('T')[0];
            if (this.categorySelect) this.categorySelect.value = campaign.category;

            if (campaign.images?.[0] && this.imagePreview) {
                this.imagePreview.innerHTML = `
                    <img src="${campaign.images[0]}" 
                         class="img-fluid rounded" 
                         alt="Campaign preview">
                    <button type="button" class="btn btn-sm btn-danger remove-image">
                        Remove Image
                    </button>
                `;
            }

            // Update form title and submit button text
            const formTitle = document.querySelector('.form-title');
            if (formTitle) formTitle.textContent = 'Edit Campaign';
            if (this.submitButton) this.submitButton.textContent = 'Update Campaign';
        } catch (error) {
            showError('Failed to load campaign data');
            console.error('Campaign loading error:', error);
        }
    }

    async handleSubmit(event, campaignId) {
        event.preventDefault();

        if (!this.validateForm()) {
            return;
        }

        this.setLoading(true);

        try {
            const formData = new FormData(this.form);
            const campaignData = {
                title: formData.get('title'),
                description: formData.get('description'),
                target_amount: parseFloat(formData.get('target_amount')),
                deadline: formData.get('deadline'),
                category: formData.get('category')
            };

            // Handle image upload
            const imageFile = formData.get('image');
            if (imageFile?.size > 0) {
                const imageUrl = await this.uploadImage(imageFile);
                campaignData.images = [imageUrl];
            }

            let campaign;
            if (campaignId) {
                campaign = await api.updateCampaign(campaignId, campaignData);
                showSuccess('Campaign updated successfully!');
            } else {
                campaign = await api.createCampaign(campaignData);
                showSuccess('Campaign created successfully!');
            }

            // Redirect to campaign details page
            setTimeout(() => {
                window.location.href = `campaign-details.html?id=${campaign._id}`;
            }, 1500);
        } catch (error) {
            showError(error.message || 'Failed to save campaign');
        } finally {
            this.setLoading(false);
        }
    }

    validateForm() {
        const rules = {
            title: { required: true, minLength: 5, maxLength: 100 },
            description: { required: true, minLength: 20, maxLength: 5000 },
            target_amount: { required: true, min: 100 },
            deadline: { required: true },
            category: { required: true }
        };

        const formData = {
            title: this.titleInput?.value,
            description: this.descriptionInput?.value,
            target_amount: this.targetAmountInput?.value,
            deadline: this.deadlineInput?.value,
            category: this.categorySelect?.value
        };

        const errors = validateForm(formData, rules);
        
        if (Object.keys(errors).length > 0) {
            Object.entries(errors).forEach(([field, message]) => {
                const input = this.form?.querySelector(`[name="${field}"]`);
                if (input) {
                    this.showFieldError(input, message);
                }
            });
            return false;
        }

        return true;
    }

    validateField(input) {
        const value = input.value.trim();
        const name = input.name;

        switch (name) {
            case 'title':
                if (!value) {
                    this.showFieldError(input, 'Title is required');
                } else if (value.length < 5) {
                    this.showFieldError(input, 'Title must be at least 5 characters');
                } else if (value.length > 100) {
                    this.showFieldError(input, 'Title must be less than 100 characters');
                } else {
                    this.clearFieldError(input);
                }
                break;

            case 'description':
                if (!value) {
                    this.showFieldError(input, 'Description is required');
                } else if (value.length < 20) {
                    this.showFieldError(input, 'Description must be at least 20 characters');
                } else if (value.length > 5000) {
                    this.showFieldError(input, 'Description must be less than 5000 characters');
                } else {
                    this.clearFieldError(input);
                }
                break;

            case 'target_amount':
                if (!value) {
                    this.showFieldError(input, 'Target amount is required');
                } else if (isNaN(value) || parseFloat(value) < 100) {
                    this.showFieldError(input, 'Target amount must be at least 100');
                } else {
                    this.clearFieldError(input);
                }
                break;

            case 'category':
                if (!value) {
                    this.showFieldError(input, 'Please select a category');
                } else {
                    this.clearFieldError(input);
                }
                break;
        }
    }

    showFieldError(input, message) {
        input.classList.add('is-invalid');
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.textContent = message;
        } else {
            const div = document.createElement('div');
            div.className = 'invalid-feedback';
            div.textContent = message;
            input.parentNode.insertBefore(div, input.nextSibling);
        }
    }

    clearFieldError(input) {
        input.classList.remove('is-invalid');
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.textContent = '';
        }
    }

    setLoading(loading) {
        if (this.submitButton && this.loadingSpinner) {
            this.submitButton.disabled = loading;
            this.loadingSpinner.style.display = loading ? 'inline-block' : 'none';
        }
    }

    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await api.uploadImage(formData);
            return response.url;
        } catch (error) {
            throw new Error('Failed to upload image');
        }
    }
}

export default new CampaignFormService();
